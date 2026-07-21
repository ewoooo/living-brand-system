import { CalloutBlock } from '@/features/guideline/components/blocks/callout-block'
import { CarouselBlock } from '@/features/guideline/components/blocks/carousel-block'
import { ContentColumnsBlock } from '@/features/guideline/components/blocks/content-columns-block'
import { DoDontBlock } from '@/features/guideline/components/blocks/do-dont-block'
import { GlyphGridBlock } from '@/features/guideline/components/blocks/glyph-grid-block'
import { LayoutGridBlock } from '@/features/guideline/components/blocks/layout-grid-block'
import { MediaShowcaseBlock } from '@/features/guideline/components/blocks/media-showcase-block'
import { SignatureShowcaseBlock } from '@/features/guideline/components/blocks/signature-showcase-block'
import { SpecListBlock } from '@/features/guideline/components/blocks/spec-list-block'
import { TypeScaleBlock } from '@/features/guideline/components/blocks/type-scale-block'
import { TypeSpecimenBlock } from '@/features/guideline/components/blocks/type-specimen-block'
import { CardRowDemo } from '@/features/guideline/components/kit/card-row'
import { ClearSpace } from '@/features/guideline/components/kit/clear-space'
import { CollapsibleDemo } from '@/features/guideline/components/kit/collapsible-demo'
import { ColorPaletteDemo } from '@/features/guideline/components/kit/color-palette'
import { DataTableDemo } from '@/features/guideline/components/kit/data-table'
import { DoDontCompareDemo } from '@/features/guideline/components/kit/do-dont-compare'
import { DownloadCardDemo } from '@/features/guideline/components/kit/download-card'
import { IconGridDemo } from '@/features/guideline/components/kit/icon-grid'
import { IllustrationGridDemo } from '@/features/guideline/components/kit/illustration-grid'
import { LayoutGridOverlayDemo } from '@/features/guideline/components/kit/layout-grid-overlay'
import { LogoClearSpaceCheckerDemo } from '@/features/guideline/components/kit/logo-clear-space-checker'
import { LogoClearSpaceUnitDemo } from '@/features/guideline/components/kit/logo-clearspace-unit'
import { LogoColorChangerDemo } from '@/features/guideline/components/kit/logo-color-changer'
import { LogoLockupDemo } from '@/features/guideline/components/kit/logo-lockup'
import { LogoVariantSelectorDemo } from '@/features/guideline/components/kit/logo-variant-selector'
import {
	brandTypeface,
	type GuidelineBlock,
	placeholderImage,
	richTextBody,
} from '@/features/guideline/components/kit/mock-blocks'
import { PaletteSwatchesDemo } from '@/features/guideline/components/kit/palette-swatches'
import { ScrollCarouselDemo } from '@/features/guideline/components/kit/scroll-carousel'
import { SpecTable } from '@/features/guideline/components/kit/spec-table'

// UI 키트 갤러리(중간공유용). 블록화가 끝난 컴포넌트는 실제 블록 renderer + Payload 타입 mock으로
// 전시하고, 아직 kit POC인 것만 kit 사본으로 전시한다. mock이 Payload 타입으로 강제되므로
// 스키마가 바뀌면 이 파일이 컴파일 에러로 먼저 깨진다 — 갤러리가 블록 시각 QA 장치를 겸한다.
// 섹션: 이미지+텍스트(최빈) / 타이포그래피 / 컬러 / 기타.

const logoPlaceholder = `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80"><rect width="220" height="80" rx="12" fill="#171717"/><text x="110" y="52" font-family="sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">LOGO</text></svg>`,
)}`

// --- 블록화 완료 컴포넌트의 mock 블록 (실제 renderer로 렌더) ---

const mediaTextBlock: Extract<GuidelineBlock, { blockType: 'contentColumns' }> = {
	blockType: 'contentColumns',
	imageRatio: '4:3',
	columns: [
		{
			id: 'mt-1',
			heading: 'Brand Story',
			body: richTextBody(
				'식물성 원료의 생명력을 피부에 되돌리는 비건 스킨케어 — 브랜드 서사를 이미지와 함께 서술한다.',
			),
			image: placeholderImage('미디어 + 텍스트 A', 11),
		},
		{
			id: 'mt-2',
			heading: 'Key Ingredient',
			body: richTextBody('혹독한 환경에서도 살아남는 허브의 회복력을 핵심 성분으로 담는다.'),
			image: placeholderImage('미디어 + 텍스트 B', 12),
		},
	],
}

const imageGroupBlock: Extract<GuidelineBlock, { blockType: 'contentColumns' }> = {
	blockType: 'contentColumns',
	imageRatio: '4:3',
	columns: [
		{ id: 'ig-1', heading: '적용 예시 A', image: placeholderImage('적용 예시 A', 13) },
		{ id: 'ig-2', heading: '적용 예시 B', image: placeholderImage('적용 예시 B', 14) },
		{ id: 'ig-3', heading: '적용 예시 C', image: placeholderImage('적용 예시 C', 15) },
	],
}

const carouselBlock: Extract<GuidelineBlock, { blockType: 'carousel' }> = {
	blockType: 'carousel',
	imageRatio: '16:9',
	slides: [
		{ id: 'cr-1', image: placeholderImage('Key Visual 01', 71), caption: '메인 키 비주얼' },
		{ id: 'cr-2', image: placeholderImage('Ampoule', 72), caption: '앰플 제품 라인' },
		{ id: 'cr-3', image: placeholderImage('Ritual', 73), caption: '스킨케어 루틴' },
	],
}

const bigImageBlock: Extract<GuidelineBlock, { blockType: 'mediaShowcase' }> = {
	blockType: 'mediaShowcase',
	imageRatio: '16:9',
	images: [{ id: 'ms-1', image: placeholderImage('16 : 9 Media', 16) }],
}

const doDontBlock: Extract<GuidelineBlock, { blockType: 'doDont' }> = {
	blockType: 'doDont',
	title: '로고 사용 예시',
	imageRatio: '4:3',
	groupLayout: 'horizontal',
	groups: [
		{
			id: 'dd-1',
			category: 'Spacing',
			kind: 'do',
			description: '충분한 여백을 확보한다.',
			examples: [
				{
					id: 'dd-1a',
					image: placeholderImage('올바른 여백', 17),
					caption: '심볼 높이 이상의 여백.',
				},
			],
		},
		{
			id: 'dd-2',
			category: 'Spacing',
			kind: 'dont',
			description: '여백을 임의로 좁히지 않는다.',
			examples: [
				{
					id: 'dd-2a',
					image: placeholderImage('좁은 여백', 18),
					caption: '최소 여백 미만 배치 금지.',
				},
			],
		},
		{
			id: 'dd-3',
			category: 'Color',
			kind: 'ok',
			description: '경계선상의 대비는 지양한다.',
			examples: [
				{
					id: 'dd-3a',
					image: placeholderImage('주의 대비', 19),
					caption: '가급적 고대비 조합 사용.',
				},
			],
		},
	],
}

const essenflux = brandTypeface(
	'Essenflux',
	'Essenflux',
	'/fonts/essenflux/Essenflux-Regular.woff2',
	'400',
	61,
)
const pretendard = brandTypeface(
	'Pretendard',
	'Pretendard',
	'/fonts/pretendard/PretendardVariable.woff2',
	'45 920',
	62,
)

const typeScaleBlock: Extract<GuidelineBlock, { blockType: 'typeScale' }> = {
	blockType: 'typeScale',
	typeface: pretendard,
	items: [
		{
			id: 'ts-1',
			name: 'Display',
			sample: 'Essenherb 에센허브',
			sizePx: 64,
			lineHeightPx: 72,
			weight: 700,
		},
		{
			id: 'ts-2',
			name: 'Title 1',
			sample: 'Essenherb 에센허브',
			sizePx: 48,
			lineHeightPx: 56,
			weight: 700,
		},
		{
			id: 'ts-3',
			name: 'Title 2',
			sample: 'Essenherb 에센허브',
			sizePx: 36,
			lineHeightPx: 44,
			weight: 600,
		},
		{
			id: 'ts-4',
			name: 'Heading 1',
			sample: 'Essenherb 에센허브',
			sizePx: 28,
			lineHeightPx: 36,
			weight: 600,
		},
		{
			id: 'ts-5',
			name: 'Heading 2',
			sample: 'Essenherb 에센허브',
			sizePx: 22,
			lineHeightPx: 30,
			weight: 600,
		},
		{
			id: 'ts-6',
			name: 'Subtitle',
			sample: 'Essenherb 에센허브',
			sizePx: 18,
			lineHeightPx: 26,
			weight: 500,
		},
		{
			id: 'ts-7',
			name: 'Body',
			sample: 'Essenherb 에센허브',
			sizePx: 16,
			lineHeightPx: 26,
			weight: 400,
		},
		{
			id: 'ts-8',
			name: 'Callout',
			sample: 'Essenherb 에센허브',
			sizePx: 14,
			lineHeightPx: 20,
			weight: 400,
		},
		{
			id: 'ts-9',
			name: 'Caption',
			sample: 'Essenherb 에센허브',
			sizePx: 12,
			lineHeightPx: 16,
			weight: 400,
		},
	],
}

const layoutGridBlock: Extract<GuidelineBlock, { blockType: 'layoutGrid' }> = {
	blockType: 'layoutGrid',
	variants: [
		{ id: 'lg-1', label: 'Desktop · 12 columns', columns: 12, gutter: '24px', margin: '64px' },
		{ id: 'lg-2', label: 'Tablet · 8 columns', columns: 8, gutter: '16px', margin: '32px' },
	],
}

const glyphGridBlock: Extract<GuidelineBlock, { blockType: 'glyphGrid' }> = {
	blockType: 'glyphGrid',
	title: null,
	typeface: essenflux,
}

const typeSpecimenBlock: Extract<GuidelineBlock, { blockType: 'typeSpecimen' }> = {
	blockType: 'typeSpecimen',
	typeface: essenflux,
	samples: {
		word: 'Essenherb',
		sentence: 'Vegan skincare, rooted in nature.',
		paragraph:
			'Essenherb finds the vitality of nature that endures even in harsh environments, and returns it to the skin. A vegan skincare brand focused on the essence of the skin.',
	},
}

const signatureShowcaseBlock: Extract<GuidelineBlock, { blockType: 'signatureShowcase' }> = {
	blockType: 'signatureShowcase',
	signatures: [
		{
			id: 'sig-1',
			label: 'Brand Signature',
			phrase: 'Essence of Herb',
			note: '피부 본질에 집중하는 식물성 비건 스킨케어. 브랜드 아이덴티티의 중심 문구.',
		},
		{
			id: 'sig-2',
			label: 'Tagline',
			phrase: 'Daily Skincare Ritual',
			note: '매일의 루틴을 하나의 의식으로. 커뮤니케이션 전반에 쓰는 태그라인.',
		},
		{
			id: 'sig-3',
			label: 'Sign-off',
			phrase: 'Essenherb, Naturally',
			note: '광고·패키지 마무리 서명. 자연스러움을 강조하는 클로징 카피.',
		},
	],
}

const specListBlock: Extract<GuidelineBlock, { blockType: 'specList' }> = {
	blockType: 'specList',
	groups: [
		{
			id: 'sl-1',
			label: 'Typography · Pretendard',
			specs: [
				{ id: 'sl-1a', key: 'Weight', value: 'Regular, Bold' },
				{ id: 'sl-1b', key: 'Kerning', value: 'Metric, -10~0' },
				{ id: 'sl-1c', key: 'Word Spacing', value: '55% / 70% / 95%' },
				{ id: 'sl-1d', key: 'Leading', value: '140%' },
			],
		},
		{
			id: 'sl-2',
			label: 'Grid · Desktop',
			specs: [
				{ id: 'sl-2a', key: 'Columns', value: '12' },
				{ id: 'sl-2b', key: 'Gutter', value: '24px' },
				{ id: 'sl-2c', key: 'Margin', value: '80px' },
				{ id: 'sl-2d', key: 'Max width', value: '1312px' },
			],
		},
	],
}

const calloutBlocks: Extract<GuidelineBlock, { blockType: 'callout' }>[] = [
	{
		blockType: 'callout',
		kind: 'must',
		title: '반드시 지킬 것',
		items: [
			{
				id: 'pc-1a',
				text: '브랜드 시그니처(Essenherb Red #EA5343)는 지정된 원색 그대로 사용한다.',
			},
			{ id: 'pc-1b', text: '로고 주위 최소 여백(clear space)을 심볼 높이 이상 확보한다.' },
			{ id: 'pc-1c', text: '국문 본문은 지정 서체 Pretendard를 사용한다.' },
		],
	},
	{
		blockType: 'callout',
		kind: 'recommended',
		title: '권장',
		items: [
			{ id: 'pc-2a', text: '사진 위에는 가독성을 위해 반전(화이트) 로고 사용을 권장한다.' },
			{ id: 'pc-2b', text: '키 비주얼에는 시그니처 서체 Essenflux를 제한적으로 활용한다.' },
		],
	},
	{
		blockType: 'callout',
		kind: 'dont',
		title: '하지 말 것',
		items: [
			{ id: 'pc-3a', text: '브랜드 시그니처는 2개 이상 중복/조합해 사용하지 않는다.' },
			{ id: 'pc-3b', text: '로고 색상을 임의로 변경하거나 그라디언트를 적용하지 않는다.' },
			{ id: 'pc-3c', text: '저대비 배경 위에 로고를 얹지 않는다.' },
		],
	},
]

export function GuidelineKitGallery() {
	return (
		<article className="flex w-full flex-col gap-8">
			<header className="mb-2">
				<p className="font-body font-medium text-muted-foreground text-xs uppercase tracking-wide">
					UI Kit · 실험 보드
				</p>
				<h1 className="mt-1 font-body font-bold text-2xl">가이드라인 컴포넌트 키트</h1>
				<p className="mt-2 font-body font-normal text-muted-foreground text-sm">
					모든 컴포넌트를 동등하게 나열합니다. 헤더의 토글로 각 컴포넌트를 접어 원하는
					것만 보세요.
				</p>
			</header>

			<CollapsibleDemo title="Content Columns · 워크호스 (2열)">
				<ContentColumnsBlock block={mediaTextBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Content Columns · 이미지 세트 (3열)">
				<ContentColumnsBlock block={imageGroupBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Carousel · 독립 이미지 슬라이드">
				<CarouselBlock block={carouselBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Media Showcase · 대형 이미지">
				<MediaShowcaseBlock block={bigImageBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Do / Don't">
				<DoDontBlock block={doDontBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Do / Don't Compare · 드래그 비교 슬라이더 (웹 전용)">
				<DoDontCompareDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Type Specimen · 라이브 입력 견본">
				<TypeSpecimenBlock block={typeSpecimenBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Glyph Grid · 글리프 인스펙터">
				<GlyphGridBlock block={glyphGridBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Type Scale">
				<TypeScaleBlock block={typeScaleBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Signature Showcase · 대형 타입 시그니처">
				<SignatureShowcaseBlock block={signatureShowcaseBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Color Palette · 컬러 팔레트">
				<ColorPaletteDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Data Table · 대량 테이블">
				<DataTableDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Spec List · 스펙 목록">
				<SpecListBlock block={specListBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Spec Table">
				<SpecTable
					columns={['Breakpoint', 'Min width', 'Columns', 'Margin']}
					rows={[
						['Small', '320px', 4, '16px'],
						['Medium', '672px', 8, '16px'],
						['Large', '1056px', 16, '16px'],
						['X-Large', '1312px', 16, '24px'],
					]}
					caption="반응형 그리드 브레이크포인트 규격 예시."
				/>
			</CollapsibleDemo>

			<CollapsibleDemo title="Layout Grid · 레이아웃 그리드">
				<LayoutGridBlock block={layoutGridBlock} />
			</CollapsibleDemo>

			<CollapsibleDemo title="Logo Lockup · 로고 배리에이션">
				<LogoLockupDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Callout · 규정/주의 콜아웃">
				<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
					{calloutBlocks.map((block) => (
						<CalloutBlock key={block.kind} block={block} />
					))}
				</div>
			</CollapsibleDemo>

			<CollapsibleDemo title="Download Card · 에셋 다운로드 타일">
				<DownloadCardDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Clear Space">
				<ClearSpace
					logoSrc={logoPlaceholder}
					alt="로고 클리어스페이스 예시"
					note="로고 주위 최소 여백은 x 이상 확보한다 (x = 심볼 높이 기준)."
				/>
			</CollapsibleDemo>

			<CollapsibleDemo title="Scroll Carousel · 세로 스크롤 가로 캐러셀">
				<ScrollCarouselDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Color Palette · 컬러 팔레트 (default · mini)">
				<PaletteSwatchesDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Logo Color Changer · 로고 컬러 체인저">
				<LogoColorChangerDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Logo Variant Selector · 로고 배리언트 셀렉터 (cash.app식)">
				<LogoVariantSelectorDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Icon Grid · 아이콘 그리드">
				<IconGridDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Layout Grid Overlay · 레이아웃 그리드 오버레이">
				<LayoutGridOverlayDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Card Row · 카드 4열 배치">
				<CardRowDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Illustration Grid · 일러스트 40종">
				<IllustrationGridDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Logo Clear-space Checker · 로고 여백 체커">
				<LogoClearSpaceCheckerDemo />
			</CollapsibleDemo>

			<CollapsibleDemo title="Logo Clear Space · A 단위(수직 줄기) NA 여백">
				<LogoClearSpaceUnitDemo />
			</CollapsibleDemo>
		</article>
	)
}
