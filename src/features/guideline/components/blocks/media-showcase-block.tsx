import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from '../globals/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type MediaShowcase = Extract<GuidelineBlock, { blockType: 'mediaShowcase' }>

export function MediaShowcaseBlock({ block }: { block: MediaShowcase }) {
	if (!block.images?.length) {
		return (
			<section>
				<GuidelineImage variant="block" ratio={block.imageRatio} className="w-full py-8" />
			</section>
		)
	}

	const images = block.images
	const columns =
		images.length === 2 ? 'md:grid-cols-2' : images.length === 3 ? 'md:grid-cols-3' : ''

	return (
		<section className={`grid gap-4 ${columns}`}>
			{images.map((item) => (
				<GuidelineImage
					key={item.id}
					variant="block"
					image={item.image}
					backgroundColor={item.imageBackgroundColor}
					scale={item.imageScale}
					ratio={block.imageRatio}
					className="w-full py-8"
				/>
			))}
		</section>
	)
}
