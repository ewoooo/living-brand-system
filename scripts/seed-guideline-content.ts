import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
import { type AnyData, assertExported, makeFromPortable } from './lib/guideline-content'

// JSON 정본의 가이드라인 문서·블록을 대상 DB에 적용한다(코드 → DB, idempotent).
//   pnpm payload run scripts/seed-guideline-content.ts            # 정본 전체
//   pnpm payload run scripts/seed-guideline-content.ts layout     # 특정 slug만
//
// 🔴 쓰기 전에 assertExported가 DB와 정본의 최신성을 비교한다. export하지 않은 admin 편집이
//    있으면 멈춘다. 의도적으로 덮어쓸 때만 FORCE=true.
// 🔴 가드의 mtime 비교는 같은 DB 안에서만 유효하다 — 다른 환경으로 승격할 때는 먼저
//    diff-guideline-content.ts로 격차를 확인할 것(대상 DB가 정본보다 최신인데도 통과할 수 있다).
// 문서가 없으면 만든다 — 정본만으로 구조(제목·부모·순서)까지 재현되어야 한다.

const CONTENT_PATH = path.join(process.cwd(), 'scripts/data/guideline-content.json')
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))

const payload = await getPayload({ config })
const fromPortable = makeFromPortable(payload)

const content: AnyData = JSON.parse(await readFile(CONTENT_PATH, 'utf8'))

// 🔴 slug 없는 항목이 정본에 있으면 멈춘다 — export가 초안을 걸러내지 못하던 시절의 산물이고,
//    그대로 쓰면 slug null로 문서를 만들려다 required 검증에서 터진다. 정본을 다시 export할 신호다.
const slugless = content.documents.filter((doc: AnyData) => !doc.slug)
if (slugless.length > 0) {
	throw new Error(
		`정본에 slug 없는 문서 ${slugless.length}건이 있다 — export를 다시 실행해 정본을 갱신할 것.`,
	)
}

const targets: AnyData[] = content.documents.filter(
	(doc: AnyData) => only.length === 0 || only.includes(doc.slug),
)
if (targets.length === 0) throw new Error(`정본에 대상 문서 없음: ${only.join(', ') || '(전체)'}`)

await assertExported(
	payload,
	CONTENT_PATH,
	targets.map((doc) => doc.slug),
)

// 리포에 원본이 있는 에셋을 filename 기준으로 upsert한다(옛 seed-ci-section.ts에서 이관).
// S3 버킷은 환경이 공유하지만 업로드 **행**은 환경마다 없으므로, 행이 없으면 문서 seed가 그 참조에서 멈춘다.
// 🔴 정본 참조로 좁히지 말 것 — 위젯이 정본에 없는 파일을 런타임에 골라 쓴다(logo-color-variant가
//    ci 로고 32종 중 색상변형 6종을 heuristic으로 찾는다. 참조로 좁히면 15종만 올라가 1칸만 렌더된다).
// 🔴 리포에 없는 에셋(essenherb 계열 143종)은 여기서 못 만든다 — 그 격차는 diff-guideline-content.ts가 드러낸다.
const ASSET_SOURCES = [
	['scripts/assets/ci', 'brand-logos', '.svg', 'image/svg+xml'],
	['scripts/assets/do-dont', 'application-images', '.webp', 'image/webp'],
] as const

for (const [dir, collection, ext, mimetype] of ASSET_SOURCES) {
	const absolute = path.join(process.cwd(), dir)
	const files = await readdir(absolute).catch(() => [])
	let created = 0
	for (const file of files.filter((f) => f.endsWith(ext))) {
		const { totalDocs } = await payload.find({
			collection,
			where: { filename: { equals: file } },
			limit: 0,
			depth: 0,
			overrideAccess: true,
		})
		if (totalDocs > 0) continue
		const buffer = await readFile(path.join(absolute, file))
		const name = file.replace(ext, '')
		await payload.create({
			collection,
			data: { name, alt: name, _status: 'published' },
			file: { data: buffer, mimetype, name: file, size: buffer.byteLength },
			overrideAccess: true,
		})
		created += 1
	}
	if (created > 0) console.log(`  에셋 업로드 ${dir}: ${created}건`)
}

// 🔴 slug는 전역 유일하지 않다 — 정본에 typography·illustration·photography가 부모만 다르게 각각 2건씩 있다.
//    slug만으로 찾으면 두 문서가 하나로 접혀 나중 항목이 앞 항목의 부모·순서·블록을 덮는다.
//    유일 키는 (slug, parent)다.
const findDoc = async (slug: string, parentId: number | string | null) => {
	const { docs } = await payload.find({
		collection: 'guideline-documents',
		where: {
			and: [
				{ slug: { equals: slug } },
				parentId == null ? { parent: { exists: false } } : { parent: { equals: parentId } },
			],
		},
		limit: 1,
		locale: 'ko',
		draft: false,
		depth: 0,
		overrideAccess: true,
	})
	return docs[0] ?? null
}

// 🔴 정본의 parent는 slug 하나뿐이라 동명 부모를 구분하지 못한다. 아래 resolveBySlugPath는 정본 배열의
//    첫 매치를 고르므로, 같은 slug의 문서가 둘 이상이면서 그게 다른 문서의 부모로 쓰이면 자식이 엉뚱한
//    부모에 붙을 수 있다(지금 데이터에서는 왕복이 바이트 동일해 맞게 풀리지만 배열 순서에 의존한다).
//    제대로 고치려면 정본의 parent를 루트부터의 slug 경로로 적어야 한다 — 그때까지는 경고만 한다.
const parentSlugs = new Set(
	content.documents.map((doc: AnyData) => doc.parent).filter((p: string | null) => p),
)
const ambiguous = [...parentSlugs].filter(
	(slug) => content.documents.filter((doc: AnyData) => doc.slug === slug).length > 1,
)
if (ambiguous.length > 0) {
	console.warn(
		`⚠️  부모로 쓰이는 slug가 정본에 중복이다(첫 매치를 쓴다): ${ambiguous.join(', ')}` +
			' — 자식이 엉뚱한 부모에 붙었는지 seed 후 content:status로 확인할 것.',
	)
}

/** 부모를 찾을 때는 정본의 부모 사슬을 따라 올라가며 (slug, parent)로 좁힌다. */
const resolveBySlugPath = async (slug: string): Promise<AnyData | null> => {
	const canonical = content.documents.find((d: AnyData) => d.slug === slug)
	if (!canonical) return null
	const parent = canonical.parent ? await resolveBySlugPath(canonical.parent) : null
	if (canonical.parent && !parent) return null
	return findDoc(slug, parent?.id ?? null)
}

// 정본은 부모를 slug로 적으므로 얕은 문서부터 처리해야 부모가 먼저 생긴다.
const depthOf = (doc: AnyData): number => {
	let depth = 0
	let cursor: AnyData | undefined = doc
	while (cursor?.parent) {
		depth += 1
		cursor = content.documents.find((d: AnyData) => d.slug === cursor?.parent)
	}
	return depth
}
targets.sort((a, b) => depthOf(a) - depthOf(b) || (a.order ?? 0) - (b.order ?? 0))

let applied = 0
const failed: string[] = []
for (const doc of targets) {
	// 🔴 문서 단위로 격리한다 — 에셋 1건이 없으면 fromPortable이 던지는데, 감싸지 않으면 그 지점에서
	//    루프가 끊겨 뒤쪽 문서는 시도조차 안 된다(대상 DB가 반쯤 적용된 채 남는다).
	//    던지는 시점은 data 조립 중이라 이 문서가 부분 기록되지는 않는다.
	try {
		// 문서 자체가 없으면 만든다 — 정본만으로 구조(제목·부모·순서)까지 재현되어야 한다.
		const parent = doc.parent ? await resolveBySlugPath(doc.parent) : null
		if (doc.parent && !parent) {
			failed.push(`${doc.slug}: 부모 없음(${doc.parent})`)
			continue
		}

		const data: AnyData = {
			title: doc.title,
			slug: doc.slug,
			// 🔴 안 넘기면 slug 자동생성 체크가 켜진 문서에서 slug가 slugify(title)로 덮인다(라우트가 깨진다).
			generateSlug: false,
			description: doc.description ?? null,
			label: doc.label ?? null,
			headerImage: await fromPortable(doc.headerImage ?? null),
			displayOrder: doc.order ?? 0,
			rules: await fromPortable(doc.rules ?? []),
			blocks: await fromPortable(doc.blocks),
			_status: 'published',
		}
		if (parent) data.parent = parent.id

		const existing = await findDoc(doc.slug, parent?.id ?? null)
		if (existing) {
			await payload.update({
				collection: 'guideline-documents',
				id: existing.id,
				locale: 'ko',
				draft: false,
				overrideAccess: true,
				data,
			})
		} else {
			await payload.create({
				collection: 'guideline-documents',
				locale: 'ko',
				draft: false,
				overrideAccess: true,
				data,
			})
		}
		applied += 1
		console.log(`  ${existing ? 'update' : 'create'} ${doc.slug}: 블록 ${doc.blocks.length}개`)
	} catch (error) {
		failed.push(`${doc.slug}: ${(error as Error).message}`)
	}
}

console.log(`✅ seed 완료 — 문서 ${applied}개`)
if (failed.length > 0) {
	console.warn(`⚠️  건너뜀 ${failed.length}건:\n${failed.map((f) => `   · ${f}`).join('\n')}`)
}
process.exit(0)
