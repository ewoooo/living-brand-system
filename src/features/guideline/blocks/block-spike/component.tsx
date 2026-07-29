import { ColorPaletteWidget } from '@/features/guideline/widgets/color-palette/component'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(blocks/block-spike) 통째 삭제.
//
// 컨테이너 Block: 프레임/레이아웃을 소유하고, 중첩 widgets를 dispatch로 렌더한다.
// top-level renderer.generated에는 위젯이 없으므로 여기서 직접 매핑한다(Phase 2에서 정식 위젯 렌더러로).
type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type BlockSpike = Extract<GuidelineBlock, { blockType: 'blockSpike' }>
type Widget = NonNullable<BlockSpike['widgets']>[number]

function renderWidget(widget: Widget) {
	switch (widget.blockType) {
		case 'colorPaletteWidget':
			// 위젯은 brand-colors를 스스로 조회하므로 인스턴스 데이터는 필요 없다(전체 팔레트).
			return <ColorPaletteWidget />
		default:
			return null
	}
}

export function BlockSpikeBlock({ block }: { block: BlockSpike }) {
	const widgets = block.widgets ?? []
	const columns = Math.max(1, block.columns ?? 1)

	return (
		<GuidelineBlockFrame layout="padded">
			<section
				className="grid gap-4"
				style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
			>
				{widgets.map((widget) => (
					<div key={widget.id}>{renderWidget(widget)}</div>
				))}
			</section>
		</GuidelineBlockFrame>
	)
}

export default BlockSpikeBlock
