import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
import { toPortable } from './lib/guideline-content'

// 가이드라인 문서 전체를 DB에서 읽어 JSON 정본으로 덮어쓴다(DB → 코드). DB는 읽기만 한다.
//   pnpm payload run scripts/export-guideline-content.ts            # 전부
//   pnpm payload run scripts/export-guideline-content.ts layout ci  # 특정 slug만
//
// 🔴 admin에서 편집했으면 시드 전에 이걸 돌려야 한다. 안 돌리면 시드가 가드에서 멈춘다(assertExported).
// 섹션 전용 export를 새로 만들지 말 것 — 모든 문서가 이 한 스크립트로 처리된다.

const CONTENT_PATH = path.join(process.cwd(), 'scripts/data/guideline-content.json')
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))

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
const selected = docs.filter(
	(doc) =>
		!String(doc.slug).startsWith('block-widget-test') &&
		(only.length === 0 || only.includes(doc.slug as string)),
)

const content = {
	documents: selected.map((doc) => ({
		slug: doc.slug,
		title: doc.title,
		parent: parentSlug(doc.parent),
		order: doc.displayOrder ?? 0,
		rules: toPortable(doc.rules ?? []),
		blocks: toPortable(doc.blocks ?? []),
	})),
}

await mkdir(path.dirname(CONTENT_PATH), { recursive: true })
await writeFile(CONTENT_PATH, `${JSON.stringify(content, null, '\t')}\n`, 'utf8')

console.log(`✅ export 완료 → ${path.relative(process.cwd(), CONTENT_PATH)}`)
for (const doc of content.documents.filter((d) => d.blocks.length > 0)) {
	console.log(`  ${doc.slug}: 블록 ${doc.blocks.length}개`)
}
console.log(
	`  (블록 없는 문서 ${content.documents.filter((d) => d.blocks.length === 0).length}개 포함)`,
)
process.exit(0)
