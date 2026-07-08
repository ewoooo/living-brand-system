/**
 * 가이드라인 4계층(Chapter→Section→Page→Block) rebuild-fresh 시드.
 * 기존 3계층 데이터(Section=A/B/C, Page=A.1/B.1)를 메모리로 읽어 4계층으로 재생성한다.
 *  - 옛 Section  → Chapter
 *  - 옛 Page     → Section (옛 페이지 슬러그/제목/순서 유지)
 *  - 각 Section  → L3 Page: 기존 콘텐츠 페이지는 blocks·description·rules를 그대로 복사한
 *                  정규화 페이지 1개. 단 'brand-logo'는 PDF 기반 4개 페이지를 신규 작성한다.
 * 기존 A장 이미지는 블록이 참조하는 application-images ID를 그대로 보존한다(재업로드 없음).
 * B.1 신규 페이지는 PDF 지면 우측을 크롭한 이미지(scripts/assets/b1)를 이름 기준 upsert로 연결한다.
 * 옛 B.1 rule은 Primary Logo에 임시 보존.
 * 실행: nvm use 22 && pnpm exec payload run scripts/seed-guideline-chapters.ts
 */
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const LOCALE = 'ko'
const B1_ASSETS = path.resolve('scripts/assets/b1')

// ── helpers ──
// 블록/rules 재삽입용: 인스턴스 id 키만 제거(관계는 숫자 ID, richText는 id 키 없음 → 안전).
const strip = <T>(value: T): T =>
	value == null
		? value
		: JSON.parse(JSON.stringify(value), (k, v) => (k === 'id' ? undefined : v))

const para = (text: string) => ({
	type: 'paragraph',
	format: '',
	indent: 0,
	version: 1,
	direction: 'ltr',
	textStyle: '',
	textFormat: 0,
	children: [{ mode: 'normal', text, type: 'text', style: '', detail: 0, format: 0, version: 1 }],
})
const rich = (texts: string[]) => ({
	root: {
		type: 'root',
		format: '',
		indent: 0,
		version: 1,
		direction: 'ltr',
		children: texts.map(para),
	},
})

// application-images 이름 기준 upsert — 재실행 시 중복 업로드/기존 A장 이미지 훼손을 방지한다.
async function upsertImage(file: string, name: string, alt: string): Promise<number> {
	const existing = await payload.find({
		collection: 'application-images',
		where: { name: { equals: name } },
		limit: 1,
		locale: LOCALE,
		overrideAccess: true,
	})
	if (existing.docs[0]) return existing.docs[0].id as number

	const doc = await payload.create({
		collection: 'application-images',
		locale: LOCALE,
		overrideAccess: true,
		filePath: path.join(B1_ASSETS, file),
		data: { name, alt } as never,
	})
	return doc.id as number
}

// 토픽 1개 = columnUnit(title=토픽명, 단일 컬럼: 본문 + PDF 크롭 이미지).
const topic = (title: string, body: string[], image: number) => ({
	blockType: 'columnUnit' as const,
	title,
	columns: [{ imageScale: '100', image, body: rich(body) }],
})

// ── B.1 Brand Logo: PDF p.12~22 기반 L3 페이지 정의(토픽별 본문 + 크롭 이미지) ──
interface TopicDef {
	title: string
	image: string
	body: string[]
}
const BRAND_LOGO_PAGES: { slug: string; title: string; topics: TopicDef[] }[] = [
	{
		slug: 'primary-logo',
		title: 'Primary Logo',
		topics: [
			{
				title: 'Design Concept',
				image: 'b1-primary-concept.png',
				body: [
					'Essenherb의 로고는 자연의 본질에 집중하고자 하는 브랜드 태도와 전문적인 제품성이라는 Essenherb만의 복합적 특성을 유려한 곡선과 단단한 직선의 조화를 통해 표현합니다.',
					'좁은 자폭을 기반으로 정밀하게 조형된 형태는 Essenherb가 추구하는 재료의 응집과 정밀한 배합, 그를 통한 탁월한 품질을 상징합니다.',
					'상단에 정렬된 듯한 독특하고 자유로운 배치를 통해 Essenherb가 전달하고자 하는 즐겁고 감각적인 스킨케어 경험을 표현합니다.',
				],
			},
			{
				title: 'Minimum Size',
				image: 'b1-primary-minsize.png',
				body: [
					'로고의 사이즈는 다양한 브랜드 접점에서 매체의 특성, 심미성, 기능성, 가시성 등을 종합적으로 고려해 결정되어야 합니다. 로고의 비율과 간격을 반드시 지켜야 하며, 임의로 변형할 수 없습니다.',
					'최소 사이즈 규정은 인쇄 및 디지털 매체에서 로고의 최소 크기를 규정한 값입니다. Essenherb 프라이머리 로고의 최소 사이즈는 가장 직관적인 로고의 높이를 기준으로 높이 20px(screen), 4mm(print)보다 작아지지 않도록 해야 합니다.',
				],
			},
			{
				title: 'Grids & Clear Space',
				image: 'b1-primary-clearspace.png',
				body: [
					'Essenherb 프라이머리 로고의 최소 공간 규정은 다음과 같습니다. 로고의 가독성을 보장하기 위해 로고 주변에 충분한 공간을 확보해야 하며, Essenherb 로고 세로획(stem) 너비 기준 3배 규격의 정사각형 박스를 최소 영역의 모듈로 설정합니다.',
					'모든 브랜드 접점에서 로고의 명료성을 확보하기 위해 시각적 혼란을 유발할 수 있는 기타 요소로부터 충분한 공간을 확보하는 것을 권장합니다.',
				],
			},
			{
				title: 'Registered Trademark',
				image: 'b1-primary-trademark.png',
				body: [
					'Registered Trademark는 특허청에 적법한 절차에 의해 상표 등록을 마친 상표에만 표시할 수 있는 기호입니다. 등록되지 않은 상표에 Registered Trademark를 사용할 경우 지식재산권 허위 표시에 대한 처벌을 받을 수 있으므로 상표 등록이 완료된 이후 사용을 권장합니다.',
					'Registered Trademark가 지나치게 작은 사이즈로 활용될 경우 뭉침 현상이 발생하여 가시성이 떨어지므로 최소 크기 규정을 준수합니다.',
				],
			},
		],
	},
	{
		slug: 'secondary-logo',
		title: 'Secondary Logo (Vertical Type)',
		topics: [
			{
				title: 'Minimum Size',
				image: 'b1-secondary-minsize.png',
				body: [
					'Essenherb 세로형 로고의 최소 사이즈 규정은 다음과 같습니다. 가장 직관적인 로고의 높이를 기준으로 높이 35px(screen), 8mm(print)보다 작아지지 않도록 해야 합니다.',
					'일관된 브랜드 아이덴티티 형성을 위해 규정을 엄격히 준수하며, 임의의 형태로 변형할 수 없습니다. 추가 규정이 필요한 경우 관련 부서에 의뢰하여 정의해야 합니다.',
				],
			},
			{
				title: 'Grids & Clear Space',
				image: 'b1-secondary-clearspace.png',
				body: [
					'Essenherb 세로형 로고의 최소 공간 규정은 다음과 같습니다. 로고의 가독성을 보장하기 위해 로고 주변에 충분한 공간을 확보해야 하며, 세로획(stem) 너비 기준 3배 규격의 정사각형 박스를 최소 영역의 모듈로 설정합니다.',
				],
			},
			{
				title: 'Registered Trademark',
				image: 'b1-secondary-trademark.png',
				body: [
					'Essenherb 세로형 로고의 Registered Trademark 최소 크기 규정은 다음과 같습니다. Registered Trademark가 지나치게 작은 사이즈로 활용될 경우 뭉침 현상이 발생하여 가시성이 떨어집니다.',
					'세로형 로고의 높이값 85px / 30mm 이하의 크기에서는 Registered Trademark를 사용할 수 없습니다.',
				],
			},
		],
	},
	{
		slug: 'service-logo',
		title: 'Service Logo (Horizontal Type)',
		topics: [
			{
				title: 'Minimum Size',
				image: 'b1-service-minsize.png',
				body: [
					'Essenherb Coffee 로고의 최소 사이즈 규정은 다음과 같습니다. 가장 직관적인 로고의 높이를 기준으로 아래 기준값보다 작아지지 않도록 해야 합니다. Horizontal Type: 20px(screen), 4mm(print).',
					'일관된 브랜드 아이덴티티 형성을 위해 규정을 엄격히 준수하며, 임의의 형태로 변형할 수 없습니다.',
				],
			},
			{
				title: 'Grids & Clear Space',
				image: 'b1-service-clearspace.png',
				body: [
					'Essenherb Coffee 로고의 최소 공간 규정은 다음과 같습니다. 로고의 가독성을 보장하기 위해 로고 주변에 충분한 공간을 확보해야 하며, 세로획(stem) 너비 기준 3배 규격의 정사각형 박스를 최소 영역의 모듈로 설정합니다.',
				],
			},
			{
				title: 'Registered Trademark',
				image: 'b1-service-trademark.png',
				body: [
					'Essenherb Coffee 로고의 Registered Trademark 최소 크기 규정은 다음과 같습니다. Registered Trademark가 지나치게 작은 사이즈로 활용될 경우 뭉침 현상이 발생하여 가시성이 떨어집니다.',
					'가장 직관적인 높이를 기준으로 아래 기준값 이하의 크기에서는 Registered Trademark를 사용할 수 없습니다.',
				],
			},
		],
	},
	{
		slug: 'incorrect-usage',
		title: 'Incorrect Usage',
		topics: [
			{
				title: 'Incorrect Usage — Proportion / Space / Shape / Color / Effect / Background',
				image: 'b1-incorrect-usage.png',
				body: [
					'사용 금지 규정은 브랜드 아이덴티티를 철저하게 관리하기 위한 규정입니다. 로고의 색상, 형태, 비례의 변형은 불가하며 잘못 사용하기 쉬운 예를 수록하였습니다.',
					'본 가이드의 규정에 어긋난 사용은 일관된 브랜드 아이덴티티 형성을 저해하고 브랜드 이미지를 손상시킬 수 있으니 유념하여 사용합니다. 사용에 대한 의문은 유관 부서로 문의 바랍니다.',
				],
			},
		],
	},
]

// ── 비어 있는 섹션의 L3 페이지 뼈대(PDF 기준, 컴팩트). 블록은 후속 단계에서 채운다. ──
// 키 = 섹션 슬러그(=옛 페이지 슬러그). 여기 없는 섹션은 기존 정규화 페이지를 유지한다.
const PAGE_MAP: Record<string, { slug: string; title: string }[]> = {
	illustration: [
		{ slug: 'illustration', title: 'Illustration' },
		{ slug: 'color-usage', title: 'Color Usage' },
		{ slug: 'usage-example', title: 'Usage Example' },
	],
	photography: [
		{ slug: 'brand-photography', title: 'Brand Photography' },
		{ slug: 'photography', title: 'Photography' },
		{ slug: 'ai-image', title: 'AI Image' },
	],
	'visual-system': [
		{ slug: 'overview', title: 'Overview' },
		{ slug: 'type-a-message', title: 'Type A (Message)' },
		{ slug: 'type-b-contents', title: 'Type B (Contents)' },
	],
	'sns-contents': [
		{ slug: 'content-guide', title: 'Content Guide' },
		{ slug: 'layout-system', title: 'Layout System' },
	],
	ad: [
		{ slug: 'online-ad', title: 'Online AD' },
		{ slug: 'offline-ad-vertical', title: 'Offline AD (Vertical)' },
		{ slug: 'offline-ad-horizontal', title: 'Offline AD (Horizontal)' },
	],
	stationery: [
		{ slug: 'business-card', title: 'Business Card' },
		{ slug: 'envelope', title: 'Envelope' },
	],
	package: [
		{ slug: 'package-box-primary', title: 'Package Box (Primary)' },
		{ slug: 'package-box-secondary', title: 'Package Box (Secondary)' },
		{ slug: 'product-packages', title: 'Product Packages' },
	],
	etc: [{ slug: 'etc', title: 'Etc.' }],
}

// ── 1. 원본 구조 읽기 ──
const oldSections = (
	await payload.find({
		collection: 'sections',
		depth: 0,
		locale: LOCALE,
		fallbackLocale: 'en',
		limit: 100,
		sort: 'displayOrder',
		draft: false,
		overrideAccess: true,
	})
).docs

const oldPages = (
	await payload.find({
		collection: 'guideline-pages',
		depth: 0,
		locale: LOCALE,
		fallbackLocale: 'en',
		limit: 500,
		sort: 'displayOrder',
		draft: false,
		overrideAccess: true,
	})
).docs

const pagesBySection = new Map<number, typeof oldPages>()
for (const page of oldPages) {
	const sid = typeof page.section === 'object' ? page.section?.id : page.section
	if (sid == null) continue
	if (!pagesBySection.has(sid)) pagesBySection.set(sid, [])
	pagesBySection.get(sid)?.push(page)
}

payload.logger.info(`source: ${oldSections.length} sections, ${oldPages.length} pages`)

// ── 2. B.1 이미지 upsert(이름 기준) → 블록에 연결할 id 맵 ──
const b1ImageIds = new Map<string, number>()
for (const page of BRAND_LOGO_PAGES) {
	for (const t of page.topics) {
		const id = await upsertImage(
			t.image,
			`B.1 ${page.title} — ${t.title}`,
			`${page.title} · ${t.title}`,
		)
		b1ImageIds.set(t.image, id)
	}
}
payload.logger.info(`B.1 images ready: ${b1ImageIds.size}`)

// ── 3. 기존 구조 삭제(rebuild-fresh, 자식→부모 순) ──
await payload.delete({
	collection: 'guideline-pages',
	where: { id: { exists: true } },
	overrideAccess: true,
})
await payload.delete({
	collection: 'sections',
	where: { id: { exists: true } },
	overrideAccess: true,
})
await payload.delete({
	collection: 'chapters',
	where: { id: { exists: true } },
	overrideAccess: true,
})

// ── 4. 4계층 재생성 ──
for (const oldSection of oldSections) {
	const chapter = await payload.create({
		collection: 'chapters',
		locale: LOCALE,
		overrideAccess: true,
		data: {
			title: oldSection.title,
			slug: oldSection.slug,
			description: oldSection.description ?? null,
			displayOrder: oldSection.displayOrder ?? 0,
			_status: 'published',
		} as never,
	})

	const childPages = pagesBySection.get(oldSection.id) ?? []
	for (const oldPage of childPages) {
		const section = await payload.create({
			collection: 'sections',
			locale: LOCALE,
			overrideAccess: true,
			data: {
				title: oldPage.title,
				slug: oldPage.slug,
				chapter: chapter.id,
				displayOrder: oldPage.displayOrder ?? 0,
				_status: 'published',
			} as never,
		})

		if (oldPage.slug === 'brand-logo') {
			// B.1: PDF 기반 4개 L3 페이지 신규 작성. 옛 B.1 rule은 첫 페이지(Primary Logo)에 임시 보존.
			for (const [index, def] of BRAND_LOGO_PAGES.entries()) {
				await payload.create({
					collection: 'guideline-pages',
					locale: LOCALE,
					overrideAccess: true,
					data: {
						title: def.title,
						slug: def.slug,
						section: section.id,
						displayOrder: index,
						blocks: def.topics.map((t) =>
							topic(t.title, t.body, b1ImageIds.get(t.image) as number),
						),
						rules: index === 0 ? (strip(oldPage.rules) ?? []) : [],
						_status: 'published',
					} as never,
				})
			}
		} else if (PAGE_MAP[oldPage.slug]) {
			// 비어 있던 섹션: PDF 기준 L3 페이지 뼈대만 생성(블록 없음). 옛 rule은 첫 페이지에 임시 보존.
			for (const [index, def] of PAGE_MAP[oldPage.slug].entries()) {
				await payload.create({
					collection: 'guideline-pages',
					locale: LOCALE,
					overrideAccess: true,
					data: {
						title: def.title,
						slug: def.slug,
						section: section.id,
						displayOrder: index,
						blocks: [],
						rules: index === 0 ? (strip(oldPage.rules) ?? []) : [],
						_status: 'published',
					} as never,
				})
			}
		} else {
			// 얕은 섹션: 기존 콘텐츠(blocks·description·rules)를 그대로 옮긴 정규화 페이지 1개.
			await payload.create({
				collection: 'guideline-pages',
				locale: LOCALE,
				overrideAccess: true,
				data: {
					title: oldPage.title,
					slug: oldPage.slug,
					section: section.id,
					displayOrder: 0,
					description: oldPage.description ?? null,
					blocks: strip(oldPage.blocks) ?? [],
					rules: strip(oldPage.rules) ?? [],
					_status: 'published',
				} as never,
			})
		}
	}
	payload.logger.info(`chapter "${chapter.title}" + ${childPages.length} sections`)
}

payload.logger.info('done')
process.exit(0)
