import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'

// CI 섹션 콘텐츠를 DB에서 읽어 JSON 정본으로 덮어쓴다: pnpm payload run scripts/export-ci-section.ts
// admin에서 편집한 결과를 코드로 되가져오는 방향(DB → 코드)이다. seed는 그 반대(코드 → DB).
//   admin 편집 → export → scripts/data/ci-section.json 커밋 → 다른 환경에 seed 실행
// 이 스크립트는 DB를 읽기만 한다.
// 🔑 업로드 참조는 id가 아니라 filename으로 적는다 — id는 환경마다 달라 stage에서 깨진다.
// biome-ignore lint/suspicious/noExplicitAny: 블록 데이터를 스키마 없이 그대로 옮긴다.
type AnyData = any

const CONTENT_PATH = path.join(process.cwd(), 'scripts/data/ci-section.json')
// 문서마다 붙는 메타. 환경에 종속되거나 seed가 스스로 정하므로 정본에서 제외한다.
const DROP_KEYS = new Set(['createdAt', 'updatedAt', 'globalType'])

const payload = await getPayload({ config })

// populate된 관계를 이식 가능한 키로 바꾼다. 업로드는 filename, brand-colors는 hex.
// (brand-colors의 name은 localized라 기준이 못 되고, hex는 required·비localized다.)
function toPortable(value: AnyData): AnyData {
	if (Array.isArray(value)) return value.map(toPortable)
	if (value && typeof value === 'object') {
		if (typeof value.filename === 'string') return { file: value.filename }
		if (typeof value.hex === 'string') return { color: value.hex }
		const out: AnyData = {}
		for (const [key, v] of Object.entries(value)) {
			if (DROP_KEYS.has(key) || v == null) continue
			out[key] = toPortable(v)
		}
		return out
	}
	return value
}

async function findDoc(slug: string, parentId: number | null) {
	const { docs } = await payload.find({
		collection: 'guideline-documents',
		where:
			parentId == null
				? { and: [{ slug: { equals: slug } }, { parent: { exists: false } }] }
				: { and: [{ slug: { equals: slug } }, { parent: { equals: parentId } }] },
		limit: 1,
		locale: 'ko',
		depth: 1, // 업로드 관계를 filename까지 populate
		draft: false, // 게시된 상태만 정본으로 삼는다
		overrideAccess: true,
	})
	return docs[0] ?? null
}

const chapter = await findDoc('brand-elements', null)
if (!chapter) throw new Error('brand-elements 챕터 없음')
const section = await findDoc('ci', chapter.id as number)
if (!section) throw new Error('ci 섹션 없음')

const { docs: pages } = await payload.find({
	collection: 'guideline-documents',
	where: { parent: { equals: section.id } },
	limit: 100,
	locale: 'ko',
	depth: 1,
	draft: false,
	sort: 'displayOrder',
	overrideAccess: true,
})

const content = {
	chapter: {
		slug: chapter.slug,
		title: chapter.title,
		order: chapter.displayOrder ?? 0,
	},
	section: {
		slug: section.slug,
		title: section.title,
		order: section.displayOrder ?? 0,
	},
	pages: pages.map((page) => ({
		slug: page.slug,
		title: page.title,
		order: page.displayOrder ?? 0,
		blocks: toPortable(page.blocks ?? []),
	})),
}

await mkdir(path.dirname(CONTENT_PATH), { recursive: true })
await writeFile(CONTENT_PATH, `${JSON.stringify(content, null, '\t')}\n`, 'utf8')

console.log(`✅ export 완료 → ${path.relative(process.cwd(), CONTENT_PATH)}`)
for (const page of content.pages) {
	console.log(`  ${page.slug}: 블록 ${page.blocks.length}개`)
}
process.exit(0)
