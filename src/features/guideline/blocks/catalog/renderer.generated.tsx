// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import type { ReactNode } from 'react'
import CalloutComponent from '../callout/component'
import CarouselComponent from '../carousel/component'
import ColorPaletteComponent from '../color-palette/component'
import ContentColumnsComponent from '../content-columns/component'
import DoDontComponent from '../do-dont/component'
import GlyphGridComponent from '../glyph-grid/component'
import LayoutGridComponent from '../layout-grid/component'
import MediaShowcaseComponent from '../media-showcase/component'
import SignatureShowcaseComponent from '../signature-showcase/component'
import SpecListComponent from '../spec-list/component'
import TypeScaleComponent from '../type-scale/component'
import TypeSpecimenComponent from '../type-specimen/component'
import type { GuidelineBlock } from '../types'

type RendererMap = {
	[Type in GuidelineBlock['blockType']]: (
		block: Extract<GuidelineBlock, { blockType: Type }>,
	) => ReactNode
}

export const guidelineBlockRenderers = {
	contentColumns: (block) => <ContentColumnsComponent block={block} />,
	carousel: (block) => <CarouselComponent block={block} />,
	mediaShowcase: (block) => <MediaShowcaseComponent block={block} />,
	colorPalette: (block) => <ColorPaletteComponent block={block} />,
	doDont: (block) => <DoDontComponent block={block} />,
	callout: (block) => <CalloutComponent block={block} />,
	specList: (block) => <SpecListComponent block={block} />,
	signatureShowcase: (block) => <SignatureShowcaseComponent block={block} />,
	typeSpecimen: (block) => <TypeSpecimenComponent block={block} />,
	typeScale: (block) => <TypeScaleComponent block={block} />,
	layoutGrid: (block) => <LayoutGridComponent block={block} />,
	glyphGrid: (block) => <GlyphGridComponent block={block} />,
} satisfies RendererMap
