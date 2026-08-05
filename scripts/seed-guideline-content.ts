import { readFile } from 'node:fs/promises'
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
// 문서 자체(제목·부모·순서)가 없으면 만들지 않고 건너뛴다 — 구조는 별도 시드가 소유한다.

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

const findBySlug = async (slug: string) => {
	const { docs } = await payload.find({
		collection: 'guideline-documents',
		where: { slug: { equals: slug } },
		limit: 1,
		locale: 'ko',
		draft: false,
		depth: 0,
		overrideAccess: true,
	})
	return docs[0] ?? null
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
for (const doc of targets) {
	// 문서 자체가 없으면 만든다 — 정본만으로 구조(제목·부모·순서)까지 재현되어야 한다.
	const parent = doc.parent ? await findBySlug(doc.parent) : null
	if (doc.parent && !parent) {
		console.warn(`⚠️  부모 없음(건너뜀): ${doc.slug} → parent ${doc.parent}`)
		continue
	}

	const data: AnyData = {
		title: doc.title,
		slug: doc.slug,
		displayOrder: doc.order ?? 0,
		blocks: await fromPortable(doc.blocks),
		_status: 'published',
	}
	if (parent) data.parent = parent.id

	const existing = await findBySlug(doc.slug)
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
}

console.log(`✅ seed 완료 — 문서 ${applied}개`)
process.exit(0)
