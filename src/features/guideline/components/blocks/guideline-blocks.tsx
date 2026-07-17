import type { ReactNode } from 'react'
import type { GuidelineDocument } from '@/payload-types'
import { ColorPaletteBlock } from './color-palette-block'
import { ColumnUnitBlock } from './column-unit-block'
import { DoDontBlock } from './do-dont-block'
import { MediaShowcaseBlock } from './media-showcase-block'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]
type RendererMap = {
	[Type in GuidelineBlock['blockType']]: (
		block: Extract<GuidelineBlock, { blockType: Type }>,
	) => ReactNode
}

const blockRenderers = {
	columnUnit: (block) => <ColumnUnitBlock block={block} />,
	mediaShowcase: (block) => <MediaShowcaseBlock block={block} />,
	colorPalette: (block) => <ColorPaletteBlock block={block} />,
	doDont: (block) => <DoDontBlock block={block} />,
} satisfies RendererMap

function renderBlock(block: GuidelineBlock): ReactNode {
	const renderer = blockRenderers[block.blockType]
	return renderer ? renderer(block as never) : null
}

export function GuidelineBlocks({
	blocks,
	betterEditor = false,
}: {
	blocks: GuidelineDocument['blocks']
	betterEditor?: boolean
}) {
	return (
		<div className="flex flex-col gap-12">
			{blocks?.map((block) => {
				const content = renderBlock(block)
				if (!content) return null

				return (
					<div key={block.id} data-better-editor-id={betterEditor ? block.id : undefined}>
						{content}
					</div>
				)
			})}
		</div>
	)
}
