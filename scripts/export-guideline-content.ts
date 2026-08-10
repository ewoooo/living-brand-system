import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
import { toPortable } from './lib/guideline-content'

// 가이드라인 문서 전체를 DB에서 읽어 JSON 스냅샷으로 덮어쓴다(DB → 코드 한 방향). DB는 읽기만 한다.
//   pnpm content:snapshot
//
// 콘텐츠의 정본은 **DB**다. 이 파일은 그 시점의 읽기 전용 사본일 뿐이고, 되돌려 쓰는 경로는 없다.
// 목적은 콘텐츠가 Postgres 한 곳에만 존재하지 않게 하고, 무엇이 언제 바뀌었는지 git으로 읽히게 하는 것.
// 복구 수단은 이 파일이 아니라 Supabase PITR과 Payload 버전 이력이다.
//
// 🔴 부분 export는 없다. 파일을 통째로 덮어쓰므로 일부 문서만 뽑으면 나머지가 스냅샷에서 사라진다.
// 🔴 엉뚱한 DB에 대고 돌렸는지는 `git diff`가 알려준다 — 문서가 대량으로 사라져 보이면 커밋하지 말 것.

const CONTENT_PATH = path.join(process.cwd(), 'scripts/data/guideline-content.json')
if (process.argv.slice(2).filter((a) => !a.startsWith('-')).length > 0) {
	throw new Error(
		'export는 slug 인자를 받지 않는다 — 스냅샷 파일을 통째로 덮어쓰므로 일부만 뽑으면 나머지가 사라진다.',
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

// 🔴 개발용 픽스처(seed-block-widget-test.ts)는 published라도 스냅샷 대상이 아니다.
//    slug를 바꾸면 이 필터도 같이 바꿀 것.
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
