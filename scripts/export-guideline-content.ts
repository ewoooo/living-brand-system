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

const { docs } = await payload.find({
	collection: 'guideline-documents',
	limit: 1000,
	locale: 'ko',
	depth: 1, // 관계를 filename·hex까지 populate
	draft: false, // 게시된 상태만 정본으로 삼는다
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

const selected = docs.filter((doc) => only.length === 0 || only.includes(doc.slug as string))

const content = {
	documents: selected.map((doc) => ({
		slug: doc.slug,
		title: doc.title,
		parent: parentSlug(doc.parent),
		order: doc.displayOrder ?? 0,
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
