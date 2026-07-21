import type { ReactNode } from 'react'
import type { GuidelineDocument } from '@/payload-types'
import { guidelineBlockRenderers } from '../catalog/renderer.generated'
import type { GuidelineBlock } from '../blocks/types'

function renderBlock(block: GuidelineBlock): ReactNode {
	const renderer = guidelineBlockRenderers[block.blockType]
	return renderer(block as never)
}

export function GuidelineBlocks({
	blocks,
	betterEditor = false,
}: {
	blocks: GuidelineDocument['blocks']
	betterEditor?: boolean
}) {
	return (
		<article className="flex flex-col">
			{blocks?.map((block) => {
				const content = renderBlock(block)

				return (
					<div key={block.id} data-better-editor-id={betterEditor ? block.id : undefined}>
						{content}
					</div>
				)
			})}
		</article>
	)
}
