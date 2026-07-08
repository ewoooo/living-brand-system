import type { GuidelinePage } from '@/payload-types'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelinePage['blocks']>[number]

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
				className="min-h-80 p-8 w-full"
			/>
		</section>
	)
}
