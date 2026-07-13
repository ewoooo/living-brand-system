import { compact, formatImage, relationshipId } from '../utils/block-text'
import { extractTextFromLexical } from '../utils/lexical-text'
import type { BlockBehavior, GuidelineBlock } from './types'

function format(block: GuidelineBlock): string {
	if (block.blockType !== 'columnUnit') return ''
	return compact(
		block.columns?.map((column) =>
			compact([
				column.heading,
				extractTextFromLexical(column.body),
				formatImage(column.image),
			]).join('\n'),
		) ?? [],
	).join('\n\n')
}

export const behavior: BlockBehavior = {
	formatForAgent: format,
	toCheckSourceSnapshot: (block) => {
		if (block.blockType !== 'columnUnit') return { evidence: '', referenceAssets: [] }
		return {
			evidence: format(block),
			referenceAssets: (block.columns ?? [])
				.map((column) => relationshipId(column.image))
				.filter((id): id is number => id != null),
		}
	},
}
