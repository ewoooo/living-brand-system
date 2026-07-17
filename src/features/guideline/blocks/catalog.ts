import type { Block } from 'payload'
import {
	ColorPaletteBlock,
	ContentColumnsBlock,
	DoDontBlock,
	MediaShowcaseBlock,
} from '@/blocks/guideline'
import { projectColorPalette } from './color-palette.block'
import { projectContentColumns } from './content-columns.block'
import { projectDoDont } from './do-dont.block'
import { projectMediaShowcase } from './media-showcase.block'
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
	mediaShowcase: { schema: MediaShowcaseBlock, project: projectMediaShowcase },
	colorPalette: { schema: ColorPaletteBlock, project: projectColorPalette },
	doDont: { schema: DoDontBlock, project: projectDoDont },
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
