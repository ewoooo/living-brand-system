import type { ComponentType } from 'react'
import type { GuidelinePage } from '@/payload-types'
import { guidelineBlockRegistry } from './blocks/guideline-block-registry'
import type { GuidelineBlock } from './blocks/guideline-block-types'

export function GuidelineBlocks({ blocks }: { blocks: GuidelinePage['blocks'] }) {
	return (
		<div className="flex flex-col gap-12">
			{blocks?.map((block) => (
				<GuidelineBlockView key={block.id} block={block} />
			))}
		</div>
	)
}

function GuidelineBlockView({ block }: { block: GuidelineBlock }) {
	const Component = guidelineBlockRegistry[block.blockType] as ComponentType<{
		block: GuidelineBlock
	}>

	return <Component block={block} />
}
