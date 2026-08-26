// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import projectBlock from '../blocks/block/projection'
import projectCallout from '../blocks/callout/projection'
import projectContentColumns from '../blocks/content-columns/projection'
import projectSection from '../blocks/section/projection'
import type { BlockProjection, GuidelineBlock } from '../blocks/types'

type ProjectionMap = {
	[Type in GuidelineBlock['blockType']]: (
		block: Extract<GuidelineBlock, { blockType: Type }>,
	) => BlockProjection<unknown>
}

export const guidelineBlockProjectors = {
	contentColumns: projectContentColumns,
	callout: projectCallout,
	block: projectBlock,
	section: projectSection,
} satisfies ProjectionMap

type RegisteredProjector = (typeof guidelineBlockProjectors)[GuidelineBlock['blockType']]
type RegisteredProjection = ReturnType<RegisteredProjector>

export type CheckBlockEvidence = RegisteredProjection['evidence']
