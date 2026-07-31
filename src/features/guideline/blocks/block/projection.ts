import type { GuidelineBlock } from '../types'

// 컨테이너 Block이 rules를 소유하므로 collectGuidelineCheckSources가 그대로 잡는다(provenance 유지).
// 자식 위젯 evidence는 접어 최소로만 표현한다(위젯별 evidence는 추후 설계).
type LayoutBlockType = Extract<GuidelineBlock, { blockType: 'block' }>

export function projectBlock(block: LayoutBlockType) {
	const count = block.children?.length ?? 0
	return {
		text: `leaf ${count}개를 담은 블록`,
		evidence: { type: 'block' as const, childCount: count },
		referenceAssets: [],
	}
}

export default projectBlock
