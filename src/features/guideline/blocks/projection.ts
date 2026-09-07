import { type BlockId, blockEntry, fixedTitle } from './registry'
import { projectSection } from './section/projection'
import { projectCardBlock } from './shared/card-projection'
import type { BlockProjection, GuidelineBlock } from './types'

type CardBlockType = Exclude<GuidelineBlock, { blockType: 'section' }>

export type CheckBlockEvidence =
	| ReturnType<typeof projectSection>['evidence']
	| ReturnType<typeof projectCardBlock<CardBlockType['blockType']>>['evidence']

/** 블록 하나를 기계(AI 챗·검색·검수)가 읽는 표현으로. 투영은 둘뿐이다 — section과 카드 블록. */
export function projectBlock(block: GuidelineBlock): BlockProjection<CheckBlockEvidence> {
	if (block.blockType === 'section') return projectSection(block)
	const entry = blockEntry(block.blockType satisfies BlockId)
	return projectCardBlock(block, block.blockType, fixedTitle(entry) ?? block.title)
}
