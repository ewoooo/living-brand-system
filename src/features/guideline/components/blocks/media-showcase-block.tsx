import type { GuidelineDocument } from '@/payload-types'
import { GuidelineImage } from './children/guideline-image'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]

export function MediaShowcaseBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'mediaShowcase' }>
}) {
	return (
		<section>
			<GuidelineImage
				image={block.image}
				backgroundColor={block.imageBackgroundColor}
				scale={block.imageScale}
				className="aspect-video w-full border border-border bg-muted/30 p-8"
			/>
		</section>
	)
}
