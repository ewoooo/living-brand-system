// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import projectCallout from '../blocks/callout/projection'
import projectCarousel from '../blocks/carousel/projection'
import projectColorPalette from '../blocks/color-palette/projection'
import projectContentColumns from '../blocks/content-columns/projection'
import projectDoDont from '../blocks/do-dont/projection'
import projectGlyphGrid from '../blocks/glyph-grid/projection'
import projectIconGrid from '../blocks/icon-grid/projection'
import projectImageGrid from '../blocks/image-grid/projection'
import projectLayoutGrid from '../blocks/layout-grid/projection'
import projectLogoGroupViewer from '../blocks/logo-group-viewer/projection'
import projectLogoViewer from '../blocks/logo-viewer/projection'
import projectMediaShowcase from '../blocks/media-showcase/projection'
import projectSignatureShowcase from '../blocks/signature-showcase/projection'
import projectSpecList from '../blocks/spec-list/projection'
import projectStemClearSpace from '../blocks/stem-clear-space/projection'
import projectTypeScale from '../blocks/type-scale/projection'
import projectTypeSpecimen from '../blocks/type-specimen/projection'
import type { BlockProjection, GuidelineBlock } from '../blocks/types'

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
	iconGrid: projectIconGrid,
	imageGrid: projectImageGrid,
	logoGroupViewer: projectLogoGroupViewer,
	logoViewer: projectLogoViewer,
	stemClearSpace: projectStemClearSpace,
} satisfies ProjectionMap

type RegisteredProjector = (typeof guidelineBlockProjectors)[GuidelineBlock['blockType']]
type RegisteredProjection = ReturnType<RegisteredProjector>

export type CheckBlockEvidence = RegisteredProjection['evidence']
