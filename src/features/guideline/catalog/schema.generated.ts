// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import type { Block } from 'payload'
import CalloutSchema from '../blocks/callout/schema'
import CarouselSchema from '../blocks/carousel/schema'
import ColorPaletteSchema from '../blocks/color-palette/schema'
import ContentColumnsSchema from '../blocks/content-columns/schema'
import DoDontSchema from '../blocks/do-dont/schema'
import GlyphGridSchema from '../blocks/glyph-grid/schema'
import IconGridSchema from '../blocks/icon-grid/schema'
import LayoutGridSchema from '../blocks/layout-grid/schema'
import MediaShowcaseSchema from '../blocks/media-showcase/schema'
import SignatureShowcaseSchema from '../blocks/signature-showcase/schema'
import SpecListSchema from '../blocks/spec-list/schema'
import TypeScaleSchema from '../blocks/type-scale/schema'
import TypeSpecimenSchema from '../blocks/type-specimen/schema'
import type { GuidelineBlock } from '../blocks/types'

type SchemaMap = {
	[Type in GuidelineBlock['blockType']]: Block
}

export const guidelineBlockSchemas = {
	contentColumns: ContentColumnsSchema,
	carousel: CarouselSchema,
	mediaShowcase: MediaShowcaseSchema,
	colorPalette: ColorPaletteSchema,
	doDont: DoDontSchema,
	callout: CalloutSchema,
	specList: SpecListSchema,
	signatureShowcase: SignatureShowcaseSchema,
	typeSpecimen: TypeSpecimenSchema,
	typeScale: TypeScaleSchema,
	layoutGrid: LayoutGridSchema,
	glyphGrid: GlyphGridSchema,
	iconGrid: IconGridSchema,
} satisfies SchemaMap

export const guidelineBlocks = Object.values(guidelineBlockSchemas)
