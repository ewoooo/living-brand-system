import { compact, formatImage, relationshipId } from '../utils/block-text'
import type { BlockBehavior, GuidelineBlock } from './types'

function format(block: GuidelineBlock): string {
	if (block.blockType !== 'mediaShowcase') return ''
	return compact(['Media showcase', formatImage(block.image)]).join('\n')
}

export const behavior: BlockBehavior = {
	formatForAgent: format,
	toCheckSourceSnapshot: (block) => {
		if (block.blockType !== 'mediaShowcase') return { evidence: '', referenceAssets: [] }
		const imageId = relationshipId(block.image)
		return {
			evidence: format(block),
			referenceAssets: imageId == null ? [] : [{ id: imageId, role: 'context' }],
		}
	},
}
