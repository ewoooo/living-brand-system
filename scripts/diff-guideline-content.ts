import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
import {
	type AnyData,
	collectFileRefs,
	toPortable,
	UPLOAD_COLLECTIONS,
} from './lib/guideline-content'

// 정본 JSON과 대상 DB의 가이드라인 콘텐츠 격차를 읽기 전용으로 비교한다(DB는 조회만 한다).
//   pnpm payload run scripts/diff-guideline-content.ts            # DATABASE_URL이 가리키는 DB
//   STRICT=true pnpm payload run scripts/diff-guideline-content.ts  # 격차가 있으면 exit 1
//
// 🔴 seed를 돌리기 전에 이걸 먼저 본다. 문서가 양쪽에 있고 DB가 정본보다 최신이면 seed가 그 편집을
//    덮는다(assertExported가 막지만, 정본을 다른 DB에서 export한 경우엔 mtime 비교가 통과한다).
// 에셋은 S3 버킷을 환경이 공유하므로 파일이 아니라 대상 DB의 업로드 행이 없는 것을 격차로 본다.

const CONTENT_PATH = path.join(process.cwd(), 'scripts/data/guideline-content.json')

const payload = await getPayload({ config })
const content: AnyData = JSON.parse(await readFile(CONTENT_PATH, 'utf8'))
const exportedAt = (await stat(CONTENT_PATH)).mtime

const { docs } = await payload.find({
	collection: 'guideline-documents',
	limit: 1000,
	locale: 'ko',
	depth: 1, // 관계를 filename·hex까지 populate — 정본과 같은 형태로 비교하기 위함
	draft: false,
	where: { _status: { equals: 'published' } },
	overrideAccess: true,
})

const slugById = new Map(docs.map((doc) => [doc.id as number, doc.slug as string]))
const parentSlug = (parent: unknown): string | null => {
	if (parent == null) return null
	const id =
		typeof parent === 'object' ? ((parent as { id?: number }).id ?? null) : Number(parent)
	return id == null ? null : (slugById.get(id) ?? null)
}

// 🔴 유일 키는 slug가 아니라 (parent, slug)다 — 부모만 다른 동명 문서가 있다.
const keyOf = (parent: string | null, slug: string) => `${parent ?? '(root)'} / ${slug}`
const dbByKey = new Map(docs.map((doc) => [keyOf(parentSlug(doc.parent), doc.slug as string), doc]))
const canonByKey = new Map<string, AnyData>(
	content.documents.map((doc: AnyData) => [keyOf(doc.parent, doc.slug), doc]),
)

const onlyCanon: string[] = []
const onlyDb: string[] = []
const changed: string[] = []

for (const [key, canon] of canonByKey) {
	const db = dbByKey.get(key)
	if (!db) {
		onlyCanon.push(`${key} (블록 ${canon.blocks.length}개)`)
		continue
	}
	const same =
		JSON.stringify(toPortable(db.blocks ?? [])) === JSON.stringify(canon.blocks) &&
		JSON.stringify(toPortable(db.rules ?? [])) === JSON.stringify(canon.rules ?? []) &&
		db.title === canon.title &&
		(db.displayOrder ?? 0) === (canon.order ?? 0)
	if (same) continue
	const dbNewer = db.updatedAt ? new Date(db.updatedAt) > exportedAt : false
	changed.push(
		`${key} — 정본 블록 ${canon.blocks.length} / DB 블록 ${(db.blocks ?? []).length}` +
			(dbNewer ? `  🔴 DB가 최신(${db.updatedAt}) — seed하면 덮인다` : ''),
	)
}
for (const key of dbByKey.keys()) if (!canonByKey.has(key)) onlyDb.push(key)

// 정본이 참조하는 업로드 파일이 대상 DB에 행으로 있는지 본다(없으면 seed가 그 참조에서 멈춘다).
const referenced = collectFileRefs(content.documents)

const found = new Map<string, string>()
for (const collection of UPLOAD_COLLECTIONS) {
	const { docs: assets } = await payload.find({
		collection,
		where: { filename: { in: [...referenced] } },
		limit: 0,
		depth: 0,
		overrideAccess: true,
	})
	for (const asset of assets) {
		const filename = asset.filename as string
		if (!found.has(filename)) found.set(filename, collection)
	}
}
const missingAssets = [...referenced].filter((file) => !found.has(file))

const list = (title: string, items: string[]) => {
	if (items.length === 0) return
	console.log(`\n${title} (${items.length}건)`)
	for (const item of items) console.log(`  · ${item}`)
}

console.log(`정본 ${canonByKey.size}건 (export ${exportedAt.toISOString()}) ↔ DB ${dbByKey.size}건`)
list('🔴 정본에만 있음 — 승격 필요', onlyCanon)
list('🟡 DB에만 있음 — 정본에 없다(옛 문서이거나 export 누락)', onlyDb)
list('🟠 양쪽에 있으나 내용이 다름', changed)
list(`🔴 대상 DB에 업로드 행이 없는 에셋 — seed가 여기서 멈춘다`, missingAssets)
console.log(`\n에셋 참조 ${referenced.size}종 중 ${found.size}종 보유`)

const gaps = onlyCanon.length + changed.length + missingAssets.length
console.log(gaps === 0 ? '\n✅ 격차 없음' : `\n격차 ${gaps}건`)
process.exit(gaps > 0 && process.env.STRICT === 'true' ? 1 : 0)
