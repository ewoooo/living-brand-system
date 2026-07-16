import type { GuidelineDocument } from '@/payload-types'
import { IMAGE_RATIO_CLASS_NAMES } from '@/types/image-ratio'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]

export function MediaShowcaseBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'mediaShowcase' }>
}) {
	const ratio = IMAGE_RATIO_CLASS_NAMES[block.imageRatio ?? '16:9']

	return (
		<section className={`grid ${ratio} place-items-center`}>
			<GuidelineImage
				image={block.image}
				backgroundColor={block.imageBackgroundColor}
				scale={block.imageScale}
				className="min-h-80 w-full py-8"
			/>
		</section>
	)
}
