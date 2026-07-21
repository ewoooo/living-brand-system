// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import projectCallout from '../callout/projection'
import projectCarousel from '../carousel/projection'
import projectColorPalette from '../color-palette/projection'
import projectContentColumns from '../content-columns/projection'
import projectDoDont from '../do-dont/projection'
import projectGlyphGrid from '../glyph-grid/projection'
import projectLayoutGrid from '../layout-grid/projection'
import projectMediaShowcase from '../media-showcase/projection'
import projectSignatureShowcase from '../signature-showcase/projection'
import projectSpecList from '../spec-list/projection'
import projectTypeScale from '../type-scale/projection'
import projectTypeSpecimen from '../type-specimen/projection'
import type { BlockProjection, GuidelineBlock } from '../types'

type ProjectionMap = {
	[Type in GuidelineBlock['blockType']]: (
		block: Extract<GuidelineBlock, { blockType: Type }>,
	) => BlockProjection<unknown>
}

export const guidelineBlockProjectors = {
	contentColumns: projectContentColumns,
	carousel: projectCarousel,
	mediaShowcase: projectMediaShowcase,
	colorPalette: projectColorPalette,
	doDont: projectDoDont,
	callout: projectCallout,
	specList: projectSpecList,
	signatureShowcase: projectSignatureShowcase,
	typeSpecimen: projectTypeSpecimen,
	typeScale: projectTypeScale,
	layoutGrid: projectLayoutGrid,
	glyphGrid: projectGlyphGrid,
} satisfies ProjectionMap

type RegisteredProjector = (typeof guidelineBlockProjectors)[GuidelineBlock['blockType']]
type RegisteredProjection = ReturnType<RegisteredProjector>

export type CheckBlockEvidence = RegisteredProjection['evidence']
