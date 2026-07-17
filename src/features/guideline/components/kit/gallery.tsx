import { ColorPaletteBlock } from '@/features/guideline/components/blocks/color-palette-block'
import { ContentColumnsBlock } from '@/features/guideline/components/blocks/content-columns-block'
import { DoDontBlock } from '@/features/guideline/components/blocks/do-dont-block'
import { MediaShowcaseBlock } from '@/features/guideline/components/blocks/media-showcase-block'
import { CarouselDemo } from '@/features/guideline/components/kit/carousel'
import { ClearSpace } from '@/features/guideline/components/kit/clear-space'
import { DataTableDemo } from '@/features/guideline/components/kit/data-table'
import { DownloadCardDemo } from '@/features/guideline/components/kit/download-card'
import { GlyphGrid } from '@/features/guideline/components/kit/glyph-grid'
import { GridSystemDiagramDemo } from '@/features/guideline/components/kit/grid-system-diagram'
import { LogoLockupDemo } from '@/features/guideline/components/kit/logo-lockup'
import {
	brandColor,
	type GuidelineBlock,
	placeholderImage,
	richTextBody,
} from '@/features/guideline/components/kit/mock-blocks'
import { RuleCalloutDemo } from '@/features/guideline/components/kit/rule-callout'
import { SignatureDisplayDemo } from '@/features/guideline/components/kit/signature-display'
import { SpecListDemo } from '@/features/guideline/components/kit/spec-list'
import { SpecTable } from '@/features/guideline/components/kit/spec-table'
import { TypeScale } from '@/features/guideline/components/kit/type-scale'
import { TypeSpecimen } from '@/features/guideline/components/kit/type-specimen'

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

const bigImageBlock: Extract<GuidelineBlock, { blockType: 'mediaShowcase' }> = {
	blockType: 'mediaShowcase',
	imageRatio: '16:9',
	image: placeholderImage('16 : 9 Media', 16),
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

const mainPaletteBlock: Extract<GuidelineBlock, { blockType: 'colorPalette' }> = {
	blockType: 'colorPalette',
	title: 'Main Palette',
	colors: [
		brandColor('Essenherb Red', '#EA5343', 'Warm Red C', 21),
		brandColor('White', '#FFFFFF', undefined, 22),
		brandColor('Black', '#000000', undefined, 23),
	],
}

const multiPaletteBlock: Extract<GuidelineBlock, { blockType: 'colorPalette' }> = {
	blockType: 'colorPalette',
	title: 'Multi Palette',
	colors: [
		brandColor('Red 1', '#FFF0EB', '705C', 31),
		brandColor('Red 2', '#FFB4AA', '169C', 32),
		brandColor('Essenherb Red', '#EA5343', 'Warm Red C', 33),
		brandColor('Red 4', '#871400', '7620C', 34),
		brandColor('Red 5', '#460500', '188C', 35),
		brandColor('Yellow 1', '#FFFAC2', '600C', 36),
		brandColor('Yellow 2', '#FFF095', '602C', 37),
		brandColor('Yellow 3', '#FFE65F', '7404C', 38),
		brandColor('Yellow 4', '#A07D0F', '118C', 39),
		brandColor('Yellow 5', '#503200', '7575C', 40),
		brandColor('Green 1', '#E6FFE6', '2253C', 41),
		brandColor('Green 2', '#A7F5AE', '2255C', 42),
		brandColor('Green 3', '#50AE5F', '2257C', 43),
		brandColor('Green 4', '#195F30', '555C', 44),
		brandColor('Green 5', '#002B1E', '567C', 45),
		brandColor('Blue 1', '#E1F0FF', '657C', 46),
		brandColor('Blue 2', '#A5CDFF', '2717C', 47),
		brandColor('Blue 3', '#3C87CD', '279C', 48),
		brandColor('Blue 4', '#1E508C', '2161C', 49),
		brandColor('Blue 5', '#001941', '2768C', 50),
		brandColor('Gray 1', '#FAFAFA', undefined, 51),
		brandColor('Gray 2', '#EBEBEB', undefined, 52),
		brandColor('Gray 3', '#ACACAC', undefined, 53),
		brandColor('Gray 4', '#464646', undefined, 54),
		brandColor('Gray 5', '#151515', undefined, 55),
	],
}

// 최상위 섹션 그룹: 제목 + 구분선 + 데모들.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="mb-20">
			<h2 className="type-title-2-emphasized mb-8 border-border border-b pb-4">{title}</h2>
			<div className="flex flex-col gap-16">{children}</div>
		</section>
	)
}

// 개별 컴포넌트 데모 라벨 + 전시.
function Demo({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<h3 className="type-caption-1-emphasized mb-4 text-foreground-muted uppercase tracking-wide">
				{title}
			</h3>
			{children}
		</div>
	)
}

export function GuidelineKitGallery() {
	return (
		<article className="w-full">
			<header className="mb-12">
				<p className="type-caption-1-emphasized text-foreground-muted uppercase tracking-wide">
					UI Kit
				</p>
				<h1 className="type-title-1-emphasized mt-1">가이드라인 컴포넌트 키트</h1>
			</header>

			<Section title="이미지 + 텍스트 (실제 블록 renderer)">
				<Demo title="Content Columns · 워크호스 (2열)">
					<ContentColumnsBlock block={mediaTextBlock} />
				</Demo>

				<Demo title="Content Columns · 이미지 세트 (3장 이상 자동 캐러셀)">
					<ContentColumnsBlock block={imageGroupBlock} />
				</Demo>

				<Demo title="Media Showcase · 대형 이미지">
					<MediaShowcaseBlock block={bigImageBlock} />
				</Demo>

				<Demo title="Do / Don't">
					<DoDontBlock block={doDontBlock} />
				</Demo>
			</Section>

			<Section title="타이포그래피">
				<Demo title="Type Specimen · 라이브 입력 견본">
					<TypeSpecimen />
				</Demo>

				<Demo title="Glyph Grid · 글리프 인스펙터">
					<GlyphGrid />
				</Demo>

				<Demo title="Type Scale">
					<TypeScale
						items={[
							{
								name: 'Display',
								sample: 'Essenherb 에센허브',
								sizePx: 64,
								lineHeightPx: 72,
								weight: 700,
							},
							{
								name: 'Title 1',
								sample: 'Essenherb 에센허브',
								sizePx: 48,
								lineHeightPx: 56,
								weight: 700,
							},
							{
								name: 'Title 2',
								sample: 'Essenherb 에센허브',
								sizePx: 36,
								lineHeightPx: 44,
								weight: 600,
							},
							{
								name: 'Heading 1',
								sample: 'Essenherb 에센허브',
								sizePx: 28,
								lineHeightPx: 36,
								weight: 600,
							},
							{
								name: 'Heading 2',
								sample: 'Essenherb 에센허브',
								sizePx: 22,
								lineHeightPx: 30,
								weight: 600,
							},
							{
								name: 'Subtitle',
								sample: 'Essenherb 에센허브',
								sizePx: 18,
								lineHeightPx: 26,
								weight: 500,
							},
							{
								name: 'Body',
								sample: 'Essenherb 에센허브',
								sizePx: 16,
								lineHeightPx: 26,
								weight: 400,
							},
							{
								name: 'Callout',
								sample: 'Essenherb 에센허브',
								sizePx: 14,
								lineHeightPx: 20,
								weight: 400,
							},
							{
								name: 'Caption',
								sample: 'Essenherb 에센허브',
								sizePx: 12,
								lineHeightPx: 16,
								weight: 400,
							},
						]}
					/>
				</Demo>

				<Demo title="Signature Display · 대형 타입 시그니처">
					<SignatureDisplayDemo />
				</Demo>
			</Section>

			<Section title="컬러 (실제 블록 renderer)">
				<Demo title="Color Palette · Main (3)">
					<ColorPaletteBlock block={mainPaletteBlock} />
				</Demo>

				<Demo title="Color Palette · Multi (25)">
					<ColorPaletteBlock block={multiPaletteBlock} />
				</Demo>
			</Section>

			<Section title="기타">
				<Demo title="Data Table · 대량 테이블">
					<DataTableDemo />
				</Demo>

				<Demo title="Spec List · 스펙 목록">
					<SpecListDemo />
				</Demo>

				<Demo title="Spec Table">
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
				</Demo>

				<Demo title="Grid System · 레이아웃 그리드">
					<GridSystemDiagramDemo />
				</Demo>

				<Demo title="Logo Lockup · 로고 배리에이션">
					<LogoLockupDemo />
				</Demo>

				<Demo title="Rule Callout · 규정/주의 콜아웃">
					<RuleCalloutDemo />
				</Demo>

				<Demo title="Download Card · 에셋 다운로드 타일">
					<DownloadCardDemo />
				</Demo>

				<Demo title="Clear Space">
					<ClearSpace
						logoSrc={logoPlaceholder}
						alt="로고 클리어스페이스 예시"
						note="로고 주위 최소 여백은 x 이상 확보한다 (x = 심볼 높이 기준)."
					/>
				</Demo>

				<Demo title="Carousel · 캐러셀">
					<CarouselDemo />
				</Demo>
			</Section>
		</article>
	)
}
