import { ColumnUnitBlock } from './column-unit-block'
import type { GuidelineBlockRegistry } from './guideline-block-types'
import { MediaShowcaseBlock } from './media-showcase-block'

export const guidelineBlockRegistry = {
	columnUnit: ColumnUnitBlock,
	mediaShowcase: MediaShowcaseBlock,
} satisfies GuidelineBlockRegistry
