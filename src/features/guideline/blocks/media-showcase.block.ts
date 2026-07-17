import { compact, formatImage, relationshipId } from '../utils/block-text'
import type { GuidelineBlock } from './types'

type MediaShowcase = Extract<GuidelineBlock, { blockType: 'mediaShowcase' }>

export function projectMediaShowcase(block: MediaShowcase) {
	const imageId = relationshipId(block.image)
	return {
		text: compact(['Media showcase', formatImage(block.image)]).join('\n'),
		evidence: { type: 'mediaShowcase' as const },
		referenceAssets: imageId == null ? [] : [{ id: imageId, role: 'context' as const }],
	}
}
