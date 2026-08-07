import type { ReactNode } from 'react'
import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { CarouselWidget } from '@/features/guideline/widgets/carousel/component'
import { ClearspaceOverlayWidget } from '@/features/guideline/widgets/clearspace-overlay/component'
import { ClearspaceViewerWidget } from '@/features/guideline/widgets/clearspace-viewer/component'
import { ColorPairingWidget } from '@/features/guideline/widgets/color-pairing/component'
import { ColorPairingRecommendationWidget } from '@/features/guideline/widgets/color-pairing-recommendation/component'
import { ColorPaletteWidget } from '@/features/guideline/widgets/color-palette/component'
import { ConceptIntroWidget } from '@/features/guideline/widgets/concept-intro/component'
import { DoDontWidget } from '@/features/guideline/widgets/do-dont/component'
import { GlyphGridWidget } from '@/features/guideline/widgets/glyph-grid/component'
import { HdColorPaletteWidget } from '@/features/guideline/widgets/hd-color-palette/component'
import { IconGridWidget } from '@/features/guideline/widgets/icon-grid/component'
import { ImageGridWidget } from '@/features/guideline/widgets/image-grid/component'
import { IncorrectUsageWidget } from '@/features/guideline/widgets/incorrect-usage/component'
import { LayoutGridWidget } from '@/features/guideline/widgets/layout-grid/component'
import { LayoutGridScope } from '@/features/guideline/widgets/layout-grid/store'
import { LayoutGridControlsWidget } from '@/features/guideline/widgets/layout-grid-controls/component'
import { LayoutGridOverlayWidget } from '@/features/guideline/widgets/layout-grid-overlay/component'
import { LogoBgPickerWidget } from '@/features/guideline/widgets/logo-bg-picker/component'
import { LogoColorVariantWidget } from '@/features/guideline/widgets/logo-color-variant/component'
import { LogoDisplayWidget } from '@/features/guideline/widgets/logo-display/component'
import { LogoGridSpecWidget } from '@/features/guideline/widgets/logo-grid-spec/component'
import { LogoGroupViewerWidget } from '@/features/guideline/widgets/logo-group-viewer/component'
import { LogoOnBackgroundWidget } from '@/features/guideline/widgets/logo-on-background/component'
import { LogoViewerWidget } from '@/features/guideline/widgets/logo-viewer/component'
import { MediaShowcaseWidget } from '@/features/guideline/widgets/media-showcase/component'
import { SectionDividerWidget } from '@/features/guideline/widgets/section-divider/component'
import { SeparatedLogoApplicationWidget } from '@/features/guideline/widgets/separated-logo-application/component'
import { StemClearSpaceWidget } from '@/features/guideline/widgets/stem-clear-space/component'
import { TypeHierarchyWidget } from '@/features/guideline/widgets/type-hierarchy/component'
import { TypeLanguageWidget } from '@/features/guideline/widgets/type-language/component'
import { TypeScaleWidget } from '@/features/guideline/widgets/type-scale/component'
import { TypeScrambleWidget } from '@/features/guideline/widgets/type-scramble/component'
import { TypeSpecimenWidget } from '@/features/guideline/widgets/type-specimen/component'
import { TypeWeightWidget } from '@/features/guideline/widgets/type-weight/component'
import type { GuidelineDocument } from '@/payload-types'
import { IMAGE_RATIO_CLASS_NAMES, type ImageRatio } from '@/types/image-ratio'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

// 레이아웃 컨테이너: 프레임/폭(width)·배치(arrangement·columns)를 소유하고 자식 leaf를 dispatch 렌더한다.
// leaf = Image(정적) | Widget(인터랙티브) 형제. top-level renderer.generated엔 leaf가 없어 여기서 직접 매핑.
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type LayoutBlockType = Extract<GuidelineBlock, { blockType: 'block' }>
type Child = NonNullable<LayoutBlockType['children']>[number]

// 위젯은 전부 인스턴스 입력 없이 자족 렌더(brand-*/폰트 스스로 조회).
function renderWidget(child: Child): ReactNode {
	switch (child.blockType) {
		case 'colorPaletteWidget':
			return <ColorPaletteWidget />
		case 'carouselWidget':
			return <CarouselWidget />
		case 'clearspaceOverlayWidget':
			return (
				<ClearspaceOverlayWidget
					logoLayer={child.logoLayer}
					gridLayer={child.gridLayer}
					scalePercent={child.scalePercent}
				/>
			)
		case 'clearspaceViewerWidget':
			return (
				<ClearspaceViewerWidget
					horizontalLogo={child.horizontalLogo}
					horizontalGrid={child.horizontalGrid}
					horizontalMinHeightPx={child.horizontalMinHeightPx}
					verticalLogo={child.verticalLogo}
					verticalGrid={child.verticalGrid}
					verticalMinHeightPx={child.verticalMinHeightPx}
				/>
			)
		case 'colorPairingWidget':
			return <ColorPairingWidget />
		case 'conceptIntroWidget':
			return <ConceptIntroWidget lead={child.lead} body={child.body} logo={child.logo} />
		case 'hdColorPaletteWidget':
			// 고른 그룹을 고른 순서대로 한 행씩, 비우면 전체를 그린다.
			// layout은 그룹 간 우열 유무를 말한다(균일 정사각형 / 순위별 높이).
			return <HdColorPaletteWidget groups={child.groups} layout={child.layout} />
		case 'colorPairingRecommendationWidget':
			return <ColorPairingRecommendationWidget />
		case 'doDontWidget':
			// 예시(이미지 또는 컬러 프리셋 + 캡션 + kind)를 인스턴스 입력으로 받는 위젯.
			// logo는 컬러 프리셋에만 쓰인다 — 이미지 예시만 있으면 조회조차 하지 않는다.
			return (
				<DoDontWidget
					imageRatio={child.imageRatio}
					columns={child.columns}
					itemLabel={child.itemLabel}
					logo={child.logo}
					examples={child.examples}
				/>
			)
		case 'glyphGridWidget':
			return <GlyphGridWidget />
		case 'iconGridWidget':
			return <IconGridWidget />
		case 'imageGridWidget':
			return <ImageGridWidget />
		case 'incorrectUsageWidget':
			// legacy doDont 블록으로 대체됐지만 스키마에 남아 있어 렌더 경로를 유지한다.
			return <IncorrectUsageWidget />
		case 'layoutGridWidget':
			// 샘플 디자인은 코드에 있고 인스턴스는 그중 하나를 고른다.
			return (
				<LayoutGridWidget
					sample={child.sample}
					caption={child.caption}
					guides={child.guides}
					marginPct={child.marginPct}
					gutterX={child.gutterX}
					gutterY={child.gutterY}
					lockMargin={child.lockMargin}
					lockGutterX={child.lockGutterX}
					lockGutterY={child.lockGutterY}
				/>
			)
		case 'layoutGridControlsWidget':
			// 같은 페이지의 layoutGridWidget 전부를 통제하는 단일 패널(모듈 스토어 공유).
			// 조절 허용 여부가 페이지별 템플릿을 만든다 — 불허한 값은 admin 값으로 고정된다.
			return (
				<LayoutGridControlsWidget
					marginPct={child.marginPct}
					marginAdjustable={child.marginAdjustable}
					gutterX={child.gutterX}
					gutterXAdjustable={child.gutterXAdjustable}
					gutterY={child.gutterY}
					gutterYAdjustable={child.gutterYAdjustable}
					guidesOn={child.guidesOn}
					guidesAdjustable={child.guidesAdjustable}
				/>
			)
		case 'layoutGridOverlayWidget':
			return <LayoutGridOverlayWidget />
		case 'logoColorVariantWidget':
			// 인스턴스 입력(logo)을 받는 위젯 — 자족 렌더 위젯들과 다름.
			return <LogoColorVariantWidget logo={child.logo} />
		case 'logoBgPickerWidget':
			// 배경 하나 위에 CI 두 표현을 동시에 놓고 picker로 배경만 바꾼다(블록당 하나).
			return <LogoBgPickerWidget group={child.group} logo={child.logo} />
		case 'logoDisplayWidget':
			// logo를 pin해서 받는 위젯(fishing 없음) + 유한 사이징(width/height/padding).
			return (
				<LogoDisplayWidget
					logo={child.logo}
					width={child.width}
					height={child.height}
					padding={child.padding}
				/>
			)
		case 'logoGridSpecWidget':
			return (
				<LogoGridSpecWidget form={child.form} nameKo={child.nameKo} nameEn={child.nameEn} />
			)
		case 'logoGroupViewerWidget':
			return <LogoGroupViewerWidget />
		case 'logoOnBgWidget':
			return (
				<LogoOnBackgroundWidget
					group={child.group}
					logo={child.logo}
					column={child.column}
				/>
			)
		case 'logoViewerWidget':
			return <LogoViewerWidget />
		case 'mediaShowcaseWidget':
			return <MediaShowcaseWidget />
		case 'sectionDividerWidget':
			return (
				<SectionDividerWidget
					chapterCode={child.chapterCode}
					chapterTitle={child.chapterTitle}
					sectionCode={child.sectionCode}
					sectionTitle={child.sectionTitle}
				/>
			)
		case 'sepLogoAppWidget':
			return <SeparatedLogoApplicationWidget variants={child.variants} apps={child.apps} />
		case 'stemClearSpaceWidget':
			return <StemClearSpaceWidget />
		case 'typeHierarchyWidget':
			return <TypeHierarchyWidget language={child.language} />
		case 'typeLanguageWidget':
			return (
				<TypeLanguageWidget initialLanguage={child.initialLanguage} layout={child.layout} />
			)
		case 'typeScrambleWidget':
			return <TypeScrambleWidget text={child.text} weight={child.weight} />
		case 'typeWeightWidget':
			return (
				<TypeWeightWidget language={child.language} initialWeight={child.initialWeight} />
			)
		case 'typeScaleWidget':
			return <TypeScaleWidget />
		case 'typeSpecimenWidget':
			return <TypeSpecimenWidget />
		default:
			return null
	}
}

// aspectClass 있음(grid·carousel·featured): 고정 비율 셀 + object-cover로 block 내 모든 이미지 렌더 크기 균일(넘치면 크롭).
// aspectClass 빈 문자열(masonry, 또는 aspectRatio='original'): 원본 비율(h-auto) 유지.
// 위젯은 인터랙티브라 aspect 박스로 감싸면 깨져 — 이미지 leaf에만 비율 적용.
function renderChild(child: Child, aspectClass: string): ReactNode {
	if (child.blockType === 'image') {
		const image = typeof child.image === 'object' ? child.image : null
		if (!image?.url) return null
		const alt = image.alt ?? image.name ?? ''
		if (!aspectClass) {
			// biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용.
			return <img src={image.url} alt={alt} className="block h-auto w-full" />
		}
		return (
			<div className={`w-full overflow-hidden ${aspectClass}`}>
				{/* biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용. */}
				<img src={image.url} alt={alt} className="size-full object-cover" />
			</div>
		)
	}
	return renderWidget(child)
}

// arrangement별 배치. grid/carousel/featured는 균일 셀(aspectRatio), masonry는 원본 비율(높이 가변).
function Arrange({
	arrangement,
	columns,
	aspectRatio,
	items,
}: {
	arrangement: LayoutBlockType['arrangement']
	columns: number
	aspectRatio: ImageRatio
	items: NonNullable<LayoutBlockType['children']>
}) {
	const cols = Math.max(1, columns)
	// masonry는 원본 비율(빈 문자열), 그 외는 aspectRatio 클래스(original도 빈 문자열이라 h-auto).
	const aspectClass = arrangement === 'masonry' ? '' : IMAGE_RATIO_CLASS_NAMES[aspectRatio]

	if (arrangement === 'carousel') {
		return (
			<div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
				{items.map((child) => (
					<div
						key={child.id}
						className="shrink-0 basis-4/5 snap-center sm:basis-1/2 lg:basis-1/3"
					>
						{renderChild(child, aspectClass)}
					</div>
				))}
			</div>
		)
	}

	if (arrangement === 'masonry') {
		return (
			<div className="gap-4 [column-gap:1rem]" style={{ columnCount: cols }}>
				{items.map((child) => (
					<div key={child.id} className="mb-4 break-inside-avoid">
						{renderChild(child, '')}
					</div>
				))}
			</div>
		)
	}

	if (arrangement === 'featured') {
		// 첫 자식 전폭으로 강조 + 나머지는 columns 그리드.
		const [first, ...rest] = items
		return (
			<div className="flex flex-col gap-4">
				{first ? <div>{renderChild(first, aspectClass)}</div> : null}
				{rest.length > 0 ? (
					<div
						className="grid gap-4"
						style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
					>
						{rest.map((child) => (
							<div key={child.id}>{renderChild(child, aspectClass)}</div>
						))}
					</div>
				) : null}
			</div>
		)
	}

	// grid(기본) — columns 열 × 자동 행 wrap.
	return (
		<div
			className="grid gap-4"
			style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
		>
			{items.map((child) => (
				<div key={child.id}>{renderChild(child, aspectClass)}</div>
			))}
		</div>
	)
}

// brand-colors 참조에서 hex를 뽑는다(데이터 색 → inline style, 닫힌 토큰 규칙의 색-데이터 예외).
function bgHex(color: LayoutBlockType['background']): string | undefined {
	return color && typeof color === 'object' && color.hex ? color.hex : undefined
}

// 레이아웃 그리드 컨트롤 패널은 배치 영역이 아니라 **헤더(제목·설명 아래)**에 온다 —
// innerBackground 안에 두면 판형과 같은 어두운 면에 얹혀 읽기 어렵고, 배치 셀 하나를 차지한다.
// 값 스코프는 **블록 단위**다: 모듈 스토어로 두면 섹션 라우트가 여러 Page를 한 화면에 렌더할 때
// 페이지마다 놓인 패널이 서로 간섭한다. 그래서 패널과 배치를 한 provider로 함께 감싼다.
function splitControls(children: NonNullable<LayoutBlockType['children']>) {
	const controls = children.filter((child) => child.blockType === 'layoutGridControlsWidget')
	const arranged = children.filter((child) => child.blockType !== 'layoutGridControlsWidget')
	const needsScope =
		controls.length > 0 || arranged.some((c) => c.blockType === 'layoutGridWidget')
	return { controls, arranged, needsScope }
}

export function LayoutBlock({ block }: { block: LayoutBlockType }) {
	const outerBg = bgHex(block.background)
	const innerBg = bgHex(block.innerBackground)
	const { controls, arranged, needsScope } = splitControls(block.children ?? [])

	const body = (
		<>
			{controls.map((child) => (
				<div key={child.id}>{renderWidget(child)}</div>
			))}
			<div style={innerBg ? { background: innerBg } : undefined}>
				<Arrange
					arrangement={block.arrangement}
					columns={block.columns ?? 2}
					aspectRatio={block.aspectRatio ?? '1:1'}
					items={arranged}
				/>
			</div>
		</>
	)

	return (
		<GuidelineBlockFrame
			layout={block.width ?? 'padded'}
			style={outerBg ? { background: outerBg } : undefined}
		>
			{block.title ? <GuidelineHeader variant="block" title={block.title} /> : null}
			{block.description ? (
				<GuidelineDescription variant="block" description={block.description} />
			) : null}
			{needsScope ? <LayoutGridScope>{body}</LayoutGridScope> : body}
		</GuidelineBlockFrame>
	)
}

export default LayoutBlock
