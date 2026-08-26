import { compact } from '../../utils/block-text'
import { extractTextFromLexical } from '../../utils/lexical-text'
import projectBlock from '../block/projection'
import type { GuidelineBlock } from '../types'

// 꼭지가 기계(AI 챗·검색·검수)에 보이는 표현. 옛 페이지 문서의 title·description이 그대로 여기 있다.
// 🔴 자식 위젯·이미지는 투영하지 않는다 — 자식 블록의 projection이 그 경계를 이미 갖는다(docs/11 §4).
type SectionBlockType = Extract<GuidelineBlock, { blockType: 'section' }>

export function projectSection(block: SectionBlockType) {
	const children = (block.blocks ?? []).map(projectBlock)
	const description = extractTextFromLexical(block.description)

	return {
		// 🔴 앵커도 평문에 넣는다. 꼭지가 문서였을 때는 그 문서의 slug가 자기 searchText에 들어가
		//    검색에 걸렸다 — 블록이 되면서 그 자리가 사라졌다(2026-08-26 이관).
		text: compact([
			block.title,
			block.anchor,
			description,
			...children.map((child) => child.text),
		]).join('\n'),
		evidence: {
			type: 'section' as const,
			anchor: block.anchor,
			title: block.title,
			description: description.trim() || undefined,
			blocks: children.map((child) => child.evidence),
		},
		referenceAssets: children.flatMap((child) => child.referenceAssets),
	}
}

export default projectSection
