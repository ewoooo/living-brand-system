// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import type { Block } from 'payload'
import BlockSpikeSchema from '../blocks/block-spike/schema'
import CalloutSchema from '../blocks/callout/schema'
import CarouselSchema from '../blocks/carousel/schema'
import ColorPairingSchema from '../blocks/color-pairing/schema'
import ColorPairingRecommendationSchema from '../blocks/color-pairing-recommendation/schema'
import ColorPaletteSchema from '../blocks/color-palette/schema'
import ContentColumnsSchema from '../blocks/content-columns/schema'
import DoDontSchema from '../blocks/do-dont/schema'
import GlyphGridSchema from '../blocks/glyph-grid/schema'
import IconGridSchema from '../blocks/icon-grid/schema'
import ImageGridSchema from '../blocks/image-grid/schema'
import LayoutGridSchema from '../blocks/layout-grid/schema'
import LogoGroupViewerSchema from '../blocks/logo-group-viewer/schema'
import LogoViewerSchema from '../blocks/logo-viewer/schema'
import MediaShowcaseSchema from '../blocks/media-showcase/schema'
import SignatureShowcaseSchema from '../blocks/signature-showcase/schema'
import SpecListSchema from '../blocks/spec-list/schema'
import StemClearSpaceSchema from '../blocks/stem-clear-space/schema'
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
	blockSpike: BlockSpikeSchema,
	colorPairing: ColorPairingSchema,
	colorPairingRecommendation: ColorPairingRecommendationSchema,
	iconGrid: IconGridSchema,
	imageGrid: ImageGridSchema,
	logoGroupViewer: LogoGroupViewerSchema,
	logoViewer: LogoViewerSchema,
	stemClearSpace: StemClearSpaceSchema,
} satisfies SchemaMap

export const guidelineBlocks = Object.values(guidelineBlockSchemas)
