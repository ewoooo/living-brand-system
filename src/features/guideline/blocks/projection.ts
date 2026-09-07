import { blockEntry, fixedTitle } from './registry'
import { projectCardBlock } from './shared/card-projection'
import type { BlockProjection, GuidelineBlock } from './types'

type CardEvidence = ReturnType<typeof projectCardBlock<GuidelineBlock['blockType']>>['evidence']
/** 동결된 CheckSession 스냅샷의 옛 섹션 근거는 `captions`가 없다 — 읽는 자리에서는 선택으로 둔다. */
export type CheckBlockEvidence = Omit<CardEvidence, 'captions'> & { captions?: string[] }

/** 블록 하나를 기계(AI 챗·검색·검수)가 읽는 표현으로. 투영은 하나다 — 블록 종류는 판별자(`type`)로만 다르다. */
export function projectBlock(block: GuidelineBlock): BlockProjection<CheckBlockEvidence> {
	const entry = blockEntry(block.blockType)
	return projectCardBlock(block, block.blockType, fixedTitle(entry) ?? block.title)
}
