import { GuidelineImage } from '@/features/guideline/components/globals/guideline-image'
import type { GuidelineDocument } from '@/payload-types'
import { GuidelineBlockFrame } from '../shared/guideline-block-frame'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type MediaShowcase = Extract<GuidelineBlock, { blockType: 'mediaShowcase' }>

export function MediaShowcaseBlock({ block }: { block: MediaShowcase }) {
	if (!block.images?.length) {
		return (
			<GuidelineBlockFrame layout="padded">
				<section>
					<GuidelineImage
						variant="block"
						ratio={block.imageRatio}
						className="w-full py-8"
					/>
				</section>
			</GuidelineBlockFrame>
		)
	}

	const images = block.images
	const columns =
		images.length === 2 ? 'md:grid-cols-2' : images.length === 3 ? 'md:grid-cols-3' : ''

	return (
		<GuidelineBlockFrame layout="padded">
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
		</GuidelineBlockFrame>
	)
}

export default MediaShowcaseBlock
