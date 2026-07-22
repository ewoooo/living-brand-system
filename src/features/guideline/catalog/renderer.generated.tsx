// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import type { ReactNode } from 'react'
import CalloutComponent from '../blocks/callout/component'
import CarouselComponent from '../blocks/carousel/component'
import ColorPaletteComponent from '../blocks/color-palette/component'
import ContentColumnsComponent from '../blocks/content-columns/component'
import DoDontComponent from '../blocks/do-dont/component'
import GlyphGridComponent from '../blocks/glyph-grid/component'
import IconGridComponent from '../blocks/icon-grid/component'
import LayoutGridComponent from '../blocks/layout-grid/component'
import MediaShowcaseComponent from '../blocks/media-showcase/component'
import SignatureShowcaseComponent from '../blocks/signature-showcase/component'
import SpecListComponent from '../blocks/spec-list/component'
import TypeScaleComponent from '../blocks/type-scale/component'
import TypeSpecimenComponent from '../blocks/type-specimen/component'
import type { GuidelineBlock } from '../blocks/types'

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
	iconGrid: (block) => <IconGridComponent block={block} />,
} satisfies RendererMap
