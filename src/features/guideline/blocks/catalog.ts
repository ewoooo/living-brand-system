import type { Block } from 'payload'
import { projectCallout } from './callout/projection'
import { CalloutBlock } from './callout/schema'
import { projectCarousel } from './carousel/projection'
import { CarouselBlock } from './carousel/schema'
import { projectColorPalette } from './color-palette/projection'
import { ColorPaletteBlock } from './color-palette/schema'
import { projectContentColumns } from './content-columns/projection'
import { ContentColumnsBlock } from './content-columns/schema'
import { projectDoDont } from './do-dont/projection'
import { DoDontBlock } from './do-dont/schema'
import { projectGlyphGrid } from './glyph-grid/projection'
import { GlyphGridBlock } from './glyph-grid/schema'
import { projectLayoutGrid } from './layout-grid/projection'
import { LayoutGridBlock } from './layout-grid/schema'
import { projectMediaShowcase } from './media-showcase/projection'
import { MediaShowcaseBlock } from './media-showcase/schema'
import { projectSignatureShowcase } from './signature-showcase/projection'
import { SignatureShowcaseBlock } from './signature-showcase/schema'
import { projectSpecList } from './spec-list/projection'
import { SpecListBlock } from './spec-list/schema'
import { projectTypeScale } from './type-scale/projection'
import { TypeScaleBlock } from './type-scale/schema'
import { projectTypeSpecimen } from './type-specimen/projection'
import { TypeSpecimenBlock } from './type-specimen/schema'
import type { BlockProjection, CheckReferenceAssetRef, GuidelineBlock } from './types'

type DefinitionMap = {
	[Type in GuidelineBlock['blockType']]: {
		schema: Block
		project: (block: Extract<GuidelineBlock, { blockType: Type }>) => BlockProjection<unknown>
	}
}

// Payload schema와 Agent/Check projection을 한 곳에 등록한다. React renderer는 별도 경계를 쓴다.
export const guidelineBlockCatalog = {
	contentColumns: { schema: ContentColumnsBlock, project: projectContentColumns },
	carousel: { schema: CarouselBlock, project: projectCarousel },
	mediaShowcase: { schema: MediaShowcaseBlock, project: projectMediaShowcase },
	colorPalette: { schema: ColorPaletteBlock, project: projectColorPalette },
	doDont: { schema: DoDontBlock, project: projectDoDont },
	callout: { schema: CalloutBlock, project: projectCallout },
	specList: { schema: SpecListBlock, project: projectSpecList },
	signatureShowcase: { schema: SignatureShowcaseBlock, project: projectSignatureShowcase },
	typeSpecimen: { schema: TypeSpecimenBlock, project: projectTypeSpecimen },
	typeScale: { schema: TypeScaleBlock, project: projectTypeScale },
	layoutGrid: { schema: LayoutGridBlock, project: projectLayoutGrid },
	glyphGrid: { schema: GlyphGridBlock, project: projectGlyphGrid },
} satisfies DefinitionMap

export const guidelineBlocks = Object.values(guidelineBlockCatalog).map(({ schema }) => schema)

type RegisteredDefinition = (typeof guidelineBlockCatalog)[GuidelineBlock['blockType']]
type RegisteredProjection = ReturnType<RegisteredDefinition['project']>

export type CheckBlockEvidence = RegisteredProjection['evidence']

export type CheckEvidence =
	| CheckBlockEvidence
	| {
			type: 'document'
			description?: string
			blocks: CheckBlockEvidence[]
	  }

export interface CheckSourceSnapshot {
	evidence: CheckEvidence
	referenceAssets: CheckReferenceAssetRef[]
}

export interface BlockCheckSourceSnapshot {
	evidence: CheckBlockEvidence
	referenceAssets: CheckReferenceAssetRef[]
}

/** 등록된 블록을 Agent/Search와 Check가 공유하는 표현으로 변환한다. */
export function projectBlock(block: GuidelineBlock): BlockProjection<CheckBlockEvidence> {
	const definition = guidelineBlockCatalog[block.blockType]
	return definition.project(block as never)
}
