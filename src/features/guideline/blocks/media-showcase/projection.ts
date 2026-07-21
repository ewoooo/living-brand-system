import { compact, formatImage, relationshipId } from '../../utils/block-text'
import type { GuidelineBlock } from '../types'

type MediaShowcase = Extract<GuidelineBlock, { blockType: 'mediaShowcase' }>

export function projectMediaShowcase(block: MediaShowcase) {
	const images = block.images ?? []

	return {
		text: compact(['Media showcase', ...images.map((item) => formatImage(item.image))]).join(
			'\n',
		),
		evidence: { type: 'mediaShowcase' as const },
		referenceAssets: images
			.map((item) => relationshipId(item.image))
			.filter((id): id is number => id != null)
			.map((id) => ({ id, role: 'context' as const })),
	}
}

export default projectMediaShowcase
