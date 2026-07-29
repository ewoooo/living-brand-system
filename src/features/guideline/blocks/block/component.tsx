import type { ReactNode } from 'react'
import { GuidelineDescription } from '@/features/guideline/components/globals/guideline-description'
import { GuidelineHeader } from '@/features/guideline/components/globals/guideline-header'
import { CarouselWidget } from '@/features/guideline/widgets/carousel/component'
import { ColorPairingWidget } from '@/features/guideline/widgets/color-pairing/component'
import { ColorPairingRecommendationWidget } from '@/features/guideline/widgets/color-pairing-recommendation/component'
import { ColorPaletteWidget } from '@/features/guideline/widgets/color-palette/component'
import { GlyphGridWidget } from '@/features/guideline/widgets/glyph-grid/component'
import { IconGridWidget } from '@/features/guideline/widgets/icon-grid/component'
import { ImageGridWidget } from '@/features/guideline/widgets/image-grid/component'
import { LayoutGridWidget } from '@/features/guideline/widgets/layout-grid/component'
import { LayoutGridOverlayWidget } from '@/features/guideline/widgets/layout-grid-overlay/component'
import { LogoGroupViewerWidget } from '@/features/guideline/widgets/logo-group-viewer/component'
import { LogoViewerWidget } from '@/features/guideline/widgets/logo-viewer/component'
import { MediaShowcaseWidget } from '@/features/guideline/widgets/media-showcase/component'
import { StemClearSpaceWidget } from '@/features/guideline/widgets/stem-clear-space/component'
import { TypeScaleWidget } from '@/features/guideline/widgets/type-scale/component'
import { TypeSpecimenWidget } from '@/features/guideline/widgets/type-specimen/component'
import type { GuidelineDocument } from '@/payload-types'
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
		case 'colorPairingWidget':
			return <ColorPairingWidget />
		case 'colorPairingRecommendationWidget':
			return <ColorPairingRecommendationWidget />
		case 'glyphGridWidget':
			return <GlyphGridWidget />
		case 'iconGridWidget':
			return <IconGridWidget />
		case 'imageGridWidget':
			return <ImageGridWidget />
		case 'layoutGridWidget':
			return <LayoutGridWidget />
		case 'layoutGridOverlayWidget':
			return <LayoutGridOverlayWidget />
		case 'logoGroupViewerWidget':
			return <LogoGroupViewerWidget />
		case 'logoViewerWidget':
			return <LogoViewerWidget />
		case 'mediaShowcaseWidget':
			return <MediaShowcaseWidget />
		case 'stemClearSpaceWidget':
			return <StemClearSpaceWidget />
		case 'typeScaleWidget':
			return <TypeScaleWidget />
		case 'typeSpecimenWidget':
			return <TypeSpecimenWidget />
		default:
			return null
	}
}

// uniform=true(grid·carousel): 고정 aspect-square 셀 + object-cover로 block 내 모든 이미지 렌더 크기 균일(넘치면 크롭).
// uniform=false(masonry): 원본 비율(h-auto) 유지 — 높이 가변 벽돌쌓기가 목적.
// 위젯은 인터랙티브라 aspect 박스로 감싸면 깨져 — 이미지 leaf에만 균일 적용.
function renderChild(child: Child, uniform: boolean): ReactNode {
	if (child.blockType === 'image') {
		const image = typeof child.image === 'object' ? child.image : null
		if (!image?.url) return null
		const alt = image.alt ?? image.name ?? ''
		if (!uniform) {
			// biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용.
			return <img src={image.url} alt={alt} className="block h-auto w-full" />
		}
		return (
			<div className="aspect-square w-full overflow-hidden">
				{/* biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용. */}
				<img src={image.url} alt={alt} className="size-full object-cover" />
			</div>
		)
	}
	return renderWidget(child)
}

// arrangement별 배치. grid/carousel은 균일 셀, masonry는 높이 가변. featured는 grid로 fallback(세부 명세 대기).
function Arrange({
	arrangement,
	columns,
	items,
}: {
	arrangement: LayoutBlockType['arrangement']
	columns: number
	items: NonNullable<LayoutBlockType['children']>
}) {
	const cols = Math.max(1, columns)

	if (arrangement === 'carousel') {
		return (
			<div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
				{items.map((child) => (
					<div
						key={child.id}
						className="shrink-0 basis-4/5 snap-center sm:basis-1/2 lg:basis-1/3"
					>
						{renderChild(child, true)}
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
						{renderChild(child, false)}
					</div>
				))}
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
				<div key={child.id}>{renderChild(child, true)}</div>
			))}
		</div>
	)
}

export function LayoutBlock({ block }: { block: LayoutBlockType }) {
	return (
		<GuidelineBlockFrame layout={block.width ?? 'padded'}>
			{block.title ? <GuidelineHeader variant="block" title={block.title} /> : null}
			{block.description ? (
				<GuidelineDescription variant="block" description={block.description} />
			) : null}
			<Arrange
				arrangement={block.arrangement}
				columns={block.columns ?? 2}
				items={block.children ?? []}
			/>
		</GuidelineBlockFrame>
	)
}

export default LayoutBlock
