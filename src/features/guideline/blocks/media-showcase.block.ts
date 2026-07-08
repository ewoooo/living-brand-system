import { compact, formatImage } from '../utils/block-text'
import type { BlockBehavior } from './types'

export const behavior: BlockBehavior = {
	formatForAgent: (block) => {
		if (block.blockType !== 'mediaShowcase') return ''
		return compact(['Media showcase', formatImage(block.image)]).join('\n')
	},
}
