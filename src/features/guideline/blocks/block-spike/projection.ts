import type { GuidelineBlock } from '../types'

// ⚠️ SPIKE (임시) — block-widget-separation 검증용. 제거 시 이 폴더(blocks/block-spike) 통째 삭제.
//
// provenance 검증 요지: 컨테이너 Block이 rules를 소유하므로 collectGuidelineCheckSources가 그대로 잡는다.
// 자식 위젯은 evidence를 접어 최소로만 표현한다(Phase 2에서 위젯별 evidence 설계).
type BlockSpike = Extract<GuidelineBlock, { blockType: 'blockSpike' }>

export function projectBlockSpike(block: BlockSpike) {
	const count = block.widgets?.length ?? 0
	return {
		text: `[spike] 위젯 ${count}개를 담은 블록`,
		evidence: { type: 'blockSpike' as const, widgetCount: count },
		referenceAssets: [],
	}
}

export default projectBlockSpike
