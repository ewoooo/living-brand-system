import type { GuidelineDocument } from '@/payload-types'
import { IMAGE_RATIO_CLASS_NAMES } from '@/types/image-ratio'
import { Carousel, type CarouselSlide } from './children/carousel'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type CarouselType = Extract<GuidelineBlock, { blockType: 'carousel' }>

export function CarouselBlock({ block }: { block: CarouselType }) {
	const slides = (block.slides ?? []).map((slide): CarouselSlide => {
		const image = typeof slide.image === 'object' ? slide.image : null

		return {
			id: slide.id ?? undefined,
			image: image?.url ?? undefined,
			alt: image?.alt || slide.caption || '',
			caption: slide.caption || undefined,
		}
	})

	return <Carousel slides={slides} aspect={IMAGE_RATIO_CLASS_NAMES[block.imageRatio ?? '16:9']} />
}
