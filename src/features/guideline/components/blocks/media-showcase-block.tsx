import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]

export function MediaShowcaseBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'mediaShowcase' }>
}) {
	return (
		<section className="grid aspect-video place-items-center">
			<GuidelineImage
				image={block.image}
				backgroundColor={block.imageBackgroundColor}
				scale={block.imageScale}
				className="min-h-80 w-full py-8"
			/>
		</section>
	)
}
