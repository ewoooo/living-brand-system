import type { GuidelinePage } from '@/payload-types'
import { ColorPaletteBlock } from './color-palette-block'
import { ColumnUnitBlock } from './column-unit-block'
import { DoDontBlock } from './do-dont-block'
import { MediaShowcaseBlock } from './media-showcase-block'

export function GuidelineBlocks({ blocks }: { blocks: GuidelinePage['blocks'] }) {
	return (
		<div className="flex flex-col gap-12">
			{blocks?.map((block) => {
				switch (block.blockType) {
					case 'mediaShowcase':
						return <MediaShowcaseBlock key={block.id} block={block} />
					case 'colorPalette':
						return <ColorPaletteBlock key={block.id} block={block} />
					case 'columnUnit':
						return <ColumnUnitBlock key={block.id} block={block} />
					case 'doDont':
						return <DoDontBlock key={block.id} block={block} />
					default:
						return null
				}
			})}
		</div>
	)
}
