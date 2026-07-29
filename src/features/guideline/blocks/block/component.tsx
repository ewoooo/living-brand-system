import type { ReactNode } from 'react'
import { GuidelineImage } from '@/features/guideline/components/globals/guideline-image'
import { ColorPaletteWidget } from '@/features/guideline/widgets/color-palette/component'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

// 레이아웃 컨테이너: 프레임/폭(width)·배치(arrangement·columns)를 소유하고 자식 leaf를 dispatch 렌더한다.
// leaf = Image(정적) | Widget(인터랙티브) 형제. top-level renderer.generated엔 leaf가 없어 여기서 직접 매핑.
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type LayoutBlockType = Extract<GuidelineBlock, { blockType: 'block' }>
type Child = NonNullable<LayoutBlockType['children']>[number]

function renderChild(child: Child): ReactNode {
	switch (child.blockType) {
		case 'image':
			return <GuidelineImage variant="block" image={child.image} className="w-full" />
		case 'colorPaletteWidget':
			// 위젯은 brand-colors를 스스로 조회한다(인스턴스 데이터 불필요).
			return <ColorPaletteWidget />
		default:
			return null
	}
}

// arrangement별 배치. grid/carousel/masonry 구현. featured는 grid로 fallback(세부 명세 대기).
// ponytail: featured는 명세 오면 case 추가.
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
		// 가로 스크롤 갤러리(scroll-snap). 자동재생 없음 = a11y 부담 최소.
		return (
			<div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
				{items.map((child) => (
					<div
						key={child.id}
						className="shrink-0 basis-4/5 snap-center sm:basis-1/2 lg:basis-1/3"
					>
						{renderChild(child)}
					</div>
				))}
			</div>
		)
	}

	if (arrangement === 'masonry') {
		// 높이 불균일 아이템 벽돌쌓기. CSS column-count(자식 break-inside-avoid).
		return (
			<div className="gap-4 [column-gap:1rem]" style={{ columnCount: cols }}>
				{items.map((child) => (
					<div key={child.id} className="mb-4 break-inside-avoid">
						{renderChild(child)}
					</div>
				))}
			</div>
		)
	}

	// grid(기본) — columns 열 × 자동 행 wrap. 1×1/W×1/1×H/W×H를 이 하나로 흡수.
	return (
		<div
			className="grid gap-4"
			style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
		>
			{items.map((child) => (
				<div key={child.id}>{renderChild(child)}</div>
			))}
		</div>
	)
}

export function LayoutBlock({ block }: { block: LayoutBlockType }) {
	return (
		<GuidelineBlockFrame layout={block.width ?? 'padded'}>
			<Arrange
				arrangement={block.arrangement}
				columns={block.columns ?? 2}
				items={block.children ?? []}
			/>
		</GuidelineBlockFrame>
	)
}

export default LayoutBlock
