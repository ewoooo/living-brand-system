import { compact } from '../../utils/block-text'
import { extractTextFromLexical } from '../../utils/lexical-text'
import type { GuidelineBlock } from '../types'

// 섹션이 기계(AI 챗·검색·검수)에 보이는 표현. 옛 페이지 문서의 title·description이 그대로 여기 있다.
// 🔴 leaf(위젯·이미지)는 투영하지 않는다 — 사람이 보는 표현이다(docs/11 §4). 기계가 읽는 텍스트는
//    섹션의 title·description·rules 셋뿐이다.
type SectionBlockType = Extract<GuidelineBlock, { blockType: 'section' }>

export function projectSection(block: SectionBlockType) {
	const description = extractTextFromLexical(block.description)
	const count = (block.children ?? []).length

	return {
		// 🔴 앵커도 평문에 넣는다. 섹션이 문서였을 때는 그 문서의 slug가 자기 searchText에 들어가
		//    검색에 걸렸다 — 블록이 되면서 그 자리가 사라졌다(2026-08-26 이관).
		text: compact([block.title, block.anchor, description, `leaf ${count}개를 담은 섹션`]).join(
			'\n',
		),
		evidence: {
			type: 'section' as const,
			anchor: block.anchor ?? undefined,
			title: block.title ?? undefined,
			description: description.trim() || undefined,
		},
		referenceAssets: [],
	}
}

export default projectSection
