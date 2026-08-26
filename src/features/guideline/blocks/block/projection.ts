import { compact } from '../../utils/block-text'
import { extractTextFromLexical } from '../../utils/lexical-text'
import type { GuidelineBlock } from '../types'

// 컨테이너 Block이 rules를 소유하므로 collectGuidelineCheckSources가 그대로 잡는다(provenance 유지).
// 🔴 기계(AI 챗·검색·검수)가 읽는 텍스트는 Block이 소유한다 — title·description·rule 셋이다.
// 자식 위젯·이미지는 사람이 보는 표현이라 투영하지 않는다. 위젯별 projection을 만들지 말 것.
type LayoutBlockType = Extract<GuidelineBlock, { blockType: 'block' }>

export function projectBlock(block: LayoutBlockType) {
	const children = block.children ?? []
	const count = children.length
	// 🔴 하위 블록도 사람이 쓴 제목·본문을 갖는다. 훑지 않으면 admin에 쓴 글이 검색·챗에
	//    도달하지 못한다 — 2026-08-10에 같은 이유로 title·description을 버리던 버그가 있었다.
	const subTexts = children.flatMap((child) =>
		child.blockType === 'subBlock'
			? [compact([child.title, extractTextFromLexical(child.description)]).join('\n')]
			: [],
	)

	return {
		text: compact([
			block.title,
			extractTextFromLexical(block.description),
			`leaf ${count}개를 담은 블록`,
			...subTexts,
		]).join('\n'),
		evidence: { type: 'block' as const, childCount: count },
		referenceAssets: [],
	}
}

export default projectBlock
