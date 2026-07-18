import { compact, formatImage, relationshipId } from '../utils/block-text'
import type { GuidelineBlock } from './types'

type Carousel = Extract<GuidelineBlock, { blockType: 'carousel' }>

export function projectCarousel(block: Carousel) {
	const slides = (block.slides ?? []).map((slide) => ({
		caption: slide.caption?.trim() || undefined,
	}))

	return {
		text: compact(
			(block.slides ?? []).flatMap((slide) => [slide.caption, formatImage(slide.image)]),
		).join('\n'),
		evidence: { type: 'carousel' as const, slides },
		referenceAssets: (block.slides ?? [])
			.map((slide) => relationshipId(slide.image))
			.filter((id): id is number => id != null)
			.map((id) => ({ id, role: 'context' as const })),
	}
}
