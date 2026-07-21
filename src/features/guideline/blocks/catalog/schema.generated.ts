// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import type { Block } from 'payload'
import CalloutSchema from '../callout/schema'
import CarouselSchema from '../carousel/schema'
import ColorPaletteSchema from '../color-palette/schema'
import ContentColumnsSchema from '../content-columns/schema'
import DoDontSchema from '../do-dont/schema'
import GlyphGridSchema from '../glyph-grid/schema'
import LayoutGridSchema from '../layout-grid/schema'
import MediaShowcaseSchema from '../media-showcase/schema'
import SignatureShowcaseSchema from '../signature-showcase/schema'
import SpecListSchema from '../spec-list/schema'
import TypeScaleSchema from '../type-scale/schema'
import TypeSpecimenSchema from '../type-specimen/schema'
import type { GuidelineBlock } from '../types'

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
} satisfies SchemaMap

export const guidelineBlocks = Object.values(guidelineBlockSchemas)
