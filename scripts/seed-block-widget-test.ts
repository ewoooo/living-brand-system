import config from '@payload-config'
import { getPayload } from 'payload'
import type { GuidelineDocument } from '@/payload-types'

/**
 * Block-Widget Test 챕터 시드 — block 레이아웃(grid/carousel/masonry·폭) + 위젯 15종 검증 샘플.
 *
 * Block(레이아웃 컨테이너)이 leaf(Image·Widget)를 배치하는 각 arrangement를 한 페이지에 나열하고,
 * 각 block에 제목(title)·본문(description)으로 해당 레이아웃 설명을 달아 공유 시 이해를 돕는다.
 * 이미지 사이사이에 위젯 15종을 끼워(interleave) 위젯이 실제 페이지에서 렌더되는지 검증한다.
 * 내부 이미지는 application-images에서 랜덤 선택(임의 생성 안 함). 재실행 안전(slug upsert).
 *
 * 실행: pnpm payload run scripts/seed-block-widget-test.ts
 *
 * 🔴 개발용 픽스처다. 정본(scripts/data/guideline-content.json)에 넣지 않는다 —
 *    export-guideline-content.ts가 slug prefix(block-widget-test)로 걸러낸다. slug를 바꾸면 그 필터도 바꿀 것.
 */
type Block = NonNullable<GuidelineDocument['blocks']>[number]
// biome-ignore lint/suspicious/noExplicitAny: 시드에서 블록 필드를 느슨하게 다룬다.
type AnyBlock = any

// 단문 → lexical richText(description 필드용).
const rt = (text: string): AnyBlock => ({
	root: {
		type: 'root',
		format: '',
		indent: 0,
		version: 1,
		direction: 'ltr',
		children: [
			{
				type: 'paragraph',
				format: '',
				indent: 0,
				version: 1,
				direction: 'ltr',
				children: [
					{
						type: 'text',
						text,
						format: 0,
						style: '',
						mode: 'normal',
						detail: 0,
						version: 1,
					},
				],
			},
		],
	},
})

const payload = await getPayload({ config })

const { docs: images } = await payload.find({
	collection: 'application-images',
	limit: 100,
	depth: 0,
	overrideAccess: true,
})

// 실제로 로드되는(HEAD 200) 이미지만 추린다 — 403(S3 파일 누락)은 제외해 깨진 이미지 방지.
const base = 'http://localhost:3000'
const healthyIds: number[] = []
await Promise.all(
	images.map(async (image) => {
		if (!image.url) return
		try {
			// 파일 라우트가 HEAD를 미지원(404)해 GET으로 확인, body는 취소해 다운로드 방지.
			const res = await fetch(`${base}${image.url}`)
			res.body?.cancel()
			if (res.ok) healthyIds.push(image.id)
		} catch {
			// 접근 불가 → 제외
		}
	}),
)
console.log(`정상 이미지 ${healthyIds.length}/${images.length}개`)

if (healthyIds.length === 0) {
	console.log('로드 가능한 application-images 없음 — 시드 건너뜀(dev 서버 실행 확인)')
} else {
	// 정상 이미지만 랜덤(중복 허용).
	const pick = (n: number) =>
		Array.from({ length: n }, () => healthyIds[Math.floor(Math.random() * healthyIds.length)])
	const imageLeaves = (n: number): AnyBlock[] =>
		pick(n).map((id) => ({ blockType: 'image', image: id }))

	// 등록된 위젯 15종(전부 인스턴스 입력 없이 자족 렌더).
	const ALL_WIDGETS = [
		'colorPaletteWidget',
		'colorPairingWidget',
		'colorPairingRecommendationWidget',
		'iconGridWidget',
		'glyphGridWidget',
		'typeSpecimenWidget',
		'typeScaleWidget',
		'logoViewerWidget',
		'logoGroupViewerWidget',
		'stemClearSpaceWidget',
		'carouselWidget',
		'imageGridWidget',
		'mediaShowcaseWidget',
		'layoutGridWidget',
		'layoutGridOverlayWidget',
	]

	// 레이아웃 데모 block: 이미지만 배치 + 설명.
	const layout = (
		title: string,
		desc: string,
		arrangement: string,
		columns: number,
		count: number,
		width = 'padded',
		aspectRatio = '1:1',
	): AnyBlock => ({
		blockType: 'block',
		title,
		description: rt(desc),
		width,
		arrangement,
		columns,
		aspectRatio,
		children: imageLeaves(count),
	})

	// 위젯 검증 block: 이미지와 위젯을 번갈아(img, widget, img, widget…) 끼운다.
	const widgetBlock = (
		title: string,
		desc: string,
		columns: number,
		widgetSlugs: string[],
	): AnyBlock => ({
		blockType: 'block',
		title,
		description: rt(desc),
		width: 'padded',
		arrangement: 'grid',
		columns,
		children: widgetSlugs.flatMap((slug) => [...imageLeaves(1), { blockType: slug }]),
	})

	const sampleBlocks: Block[] = [
		layout('Grid · 1×1 단일', 'columns=1, 이미지 1개. 가장 단순한 단일 배치.', 'grid', 1, 1),
		layout(
			'Grid · W×1 수평 배치',
			'columns=3, 이미지 3개가 한 줄에. 1:1 크롭으로 모든 이미지 렌더 크기 균일.',
			'grid',
			3,
			3,
		),
		layout(
			'Grid · W×H 격자',
			'columns=3 + 이미지 6개 → 3열 2행 격자 자동. 모든 셀 균일 크기.',
			'grid',
			3,
			6,
		),
		layout(
			'전체폭 (full)',
			'width=full. 콘텐츠가 nav 제외 main 전체 폭을 사용.',
			'grid',
			2,
			2,
			'full',
		),
		layout(
			'Carousel · 가로 스크롤',
			'scroll-snap 가로 스크롤. 좌우로 넘겨 탐색. 셀 균일 크기.',
			'carousel',
			3,
			6,
		),
		layout(
			'Masonry · 높이 불균일',
			'벽돌쌓기. 이미지 원본 비율 유지(균일 아님) — masonry만 예외.',
			'masonry',
			3,
			6,
		),
		layout(
			'Featured · 첫 항목 강조',
			'첫 자식을 전폭으로 강조 + 나머지는 columns 그리드. aspectRatio=16:9.',
			'featured',
			3,
			5,
			'padded',
			'16:9',
		),
		layout(
			'aspectRatio · 16:9',
			'모든 이미지 셀을 16:9로 크롭해 균일. (aspectRatio 직교 옵션)',
			'grid',
			3,
			6,
			'padded',
			'16:9',
		),
		layout(
			'aspectRatio · 4:3',
			'모든 이미지 셀을 4:3으로 크롭해 균일.',
			'grid',
			3,
			6,
			'padded',
			'4:3',
		),
		layout(
			'aspectRatio · 원본(original)',
			'크롭 없이 원본 비율(h-auto). 셀 높이 제각각 — 균일 아님.',
			'grid',
			3,
			4,
			'padded',
			'original',
		),
		widgetBlock(
			'위젯 검증 A (전폭 셀)',
			'이미지 사이에 위젯을 끼운 형제 leaf. columns=1이라 위젯이 전폭으로 렌더.',
			1,
			ALL_WIDGETS.slice(0, 5),
		),
		widgetBlock(
			'위젯 검증 B (전폭 셀)',
			'타입·로고 계열 위젯이 이미지와 번갈아 렌더되는지 검증.',
			1,
			ALL_WIDGETS.slice(5, 10),
		),
		widgetBlock(
			'위젯 검증 C (전폭 셀)',
			'미디어·그리드 계열 위젯 렌더 검증.',
			1,
			ALL_WIDGETS.slice(10, 15),
		),
		widgetBlock(
			'위젯 좁은 셀 스트레스 (columns=3)',
			'15종 위젯을 좁은 3열 셀에 넣어 축소 렌더 견디는지 검증.',
			3,
			ALL_WIDGETS,
		),
	] as Block[]

	async function upsert(opts: {
		slug: string
		title: string
		parentId?: number
		blocks?: Block[]
		order: number
	}): Promise<number> {
		const { docs } = await payload.find({
			collection: 'guideline-documents',
			where: { slug: { equals: opts.slug } },
			locale: 'ko',
			draft: false,
			overrideAccess: true,
			depth: 0,
			limit: 1,
		})
		const data: AnyBlock = {
			title: opts.title,
			slug: opts.slug,
			_status: 'published',
			displayOrder: opts.order,
		}
		if (opts.parentId != null) data.parent = opts.parentId
		if (opts.blocks) data.blocks = opts.blocks

		if (docs[0]) {
			await payload.update({
				collection: 'guideline-documents',
				id: docs[0].id,
				locale: 'ko',
				draft: false,
				overrideAccess: true,
				data,
			})
			return docs[0].id as number
		}
		const created = await payload.create({
			collection: 'guideline-documents',
			locale: 'ko',
			draft: false,
			overrideAccess: true,
			data,
		})
		return created.id as number
	}

	const chapterId = await upsert({
		slug: 'block-widget-test',
		title: 'Block-Widget Test',
		order: 999,
	})
	const sectionId = await upsert({
		slug: 'block-widget-test-section',
		title: 'Test Section',
		parentId: chapterId,
		order: 0,
	})
	await upsert({
		slug: 'block-widget-test-page',
		title: 'Test Page',
		parentId: sectionId,
		blocks: sampleBlocks,
		order: 0,
	})
	console.log(
		`시드 완료: Block-Widget Test(${chapterId}) > Test Section(${sectionId}) > Test Page (블록 ${sampleBlocks.length}개, 위젯 ${ALL_WIDGETS.length}종)`,
	)
}
