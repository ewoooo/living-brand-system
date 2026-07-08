import { compact, formatImage } from '../utils/block-text'
import { extractTextFromLexical } from '../utils/lexical-text'
import type { BlockBehavior } from './types'

export const behavior: BlockBehavior = {
	formatForAgent: (block) => {
		if (block.blockType !== 'columnUnit') return ''
		return compact([
			block.title,
			...(block.columns?.map((column) =>
				compact([
					column.heading,
					extractTextFromLexical(column.body),
					formatImage(column.image),
				]).join('\n'),
			) ?? []),
		]).join('\n\n')
	},
}
