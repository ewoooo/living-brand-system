import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
import { toPortable } from './lib/guideline-content'

// 가이드라인 문서 전체를 DB에서 읽어 JSON 정본으로 덮어쓴다(DB → 코드). DB는 읽기만 한다.
//   pnpm payload run scripts/export-guideline-content.ts
//
// 🔴 admin에서 편집했으면 시드 전에 이걸 돌려야 한다. 안 돌리면 시드가 가드에서 멈춘다(assertExported).
// 섹션 전용 export를 새로 만들지 말 것 — 모든 문서가 이 한 스크립트로 처리된다.
// 🔴 부분 export는 없다. 이 스크립트는 파일을 통째로 덮어쓰므로 일부 문서만 뽑으면 나머지가 정본에서
//    사라진다(seed는 slug 인자를 받지만 export는 안 받는다 — 방향이 반대라 위험도 반대다).

const CONTENT_PATH = path.join(process.cwd(), 'scripts/data/guideline-content.json')
if (process.argv.slice(2).filter((a) => !a.startsWith('-')).length > 0) {
	throw new Error(
		'export는 slug 인자를 받지 않는다 — 정본 파일을 통째로 덮어쓰므로 일부만 뽑으면 나머지가 사라진다.',
	)
}

const payload = await getPayload({ config })

// 🔴 draft:false만으로는 초안이 걸러지지 않는다 — "초안 버전을 우선하지 않는다"는 뜻일 뿐이고
//    초안 문서 자체는 그대로 반환된다. _status로 명시해야 게시된 것만 정본이 된다.
//    (걸러내지 않으면 seed가 초안을 published로 올려버리고, slug 없는 빈 초안에서 터진다.)
const { docs } = await payload.find({
	collection: 'guideline-documents',
	where: { _status: { equals: 'published' } },
	limit: 1000,
	locale: 'ko',
	depth: 1, // 관계를 filename·hex까지 populate
	draft: false,
	sort: 'displayOrder',
	overrideAccess: true,
})

// 부모를 id가 아니라 slug로 적는다 — id는 환경마다 다르다.
const slugById = new Map(docs.map((doc) => [doc.id as number, doc.slug as string]))
const parentSlug = (parent: unknown): string | null => {
	if (parent == null) return null
	const id =
		typeof parent === 'object' ? ((parent as { id?: number }).id ?? null) : Number(parent)
	return id == null ? null : (slugById.get(id) ?? null)
}

// 🔴 개발용 픽스처(seed-block-widget-test.ts)는 published라도 정본이 아니다 — 안 걸러내면
//    테스트 문서가 정본에 섞여 seed로 stage까지 나간다.
const selected = docs.filter((doc) => !String(doc.slug).startsWith('block-widget-test'))

const content = {
	documents: selected.map((doc) => ({
		slug: doc.slug,
		title: doc.title,
		label: doc.label ?? null,
		parent: parentSlug(doc.parent),
		order: doc.displayOrder ?? 0,
		// 문서 본문 설명. 관계 노드가 없는 richText라 그대로 옮긴다.
		description: doc.description ?? null,
		headerImage: toPortable(doc.headerImage ?? null),
		rules: toPortable(doc.rules ?? []),
		blocks: toPortable(doc.blocks ?? []),
	})),
}

// 🔴 참조가 줄어든 export는 정본을 파괴한다. rules·brand-colors는 커밋된 마이그레이션에 없어서 새 DB에는
//    0건이고, 그런 DB에 seed하면 fromPortable이 warn만 하고 참조를 뺀다. 그 상태를 export하면 정본에
//    빈 배열로 확정돼 연결이 영구 소실된다. 그래서 이전 정본보다 참조 수가 줄면 멈춘다.
const countRefs = (json: string, key: string) => json.split(`"${key}":`).length - 1
const next = `${JSON.stringify(content, null, '\t')}\n`
const previous = await readFile(CONTENT_PATH, 'utf8').catch(() => '')
for (const key of ['rule', 'file', 'color'] as const) {
	const before = countRefs(previous, key)
	const after = countRefs(next, key)
	if (after < before && process.env.FORCE !== 'true') {
		throw new Error(
			`export가 ${key} 참조를 ${before}→${after}로 줄인다 — 대상 DB에 참조 대상이 없는 상태로 보인다.` +
				' 정본을 덮지 않고 멈춘다(의도한 삭제라면 FORCE=true).',
		)
	}
}

await mkdir(path.dirname(CONTENT_PATH), { recursive: true })
await writeFile(CONTENT_PATH, next, 'utf8')

console.log(`✅ export 완료 → ${path.relative(process.cwd(), CONTENT_PATH)}`)
for (const doc of content.documents.filter((d) => d.blocks.length > 0)) {
	console.log(`  ${doc.slug}: 블록 ${doc.blocks.length}개`)
}
console.log(
	`  (블록 없는 문서 ${content.documents.filter((d) => d.blocks.length === 0).length}개 포함)`,
)
process.exit(0)
