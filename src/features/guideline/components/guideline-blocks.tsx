import type { GuidelinePage } from '@/payload-types'
import { ColorPaletteBlock } from './blocks/color-palette-block'
import { ColumnUnitBlock } from './blocks/column-unit-block'
import { MediaShowcaseBlock } from './blocks/media-showcase-block'

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
					default:
						return null
				}
			})}
		</div>
	)
}
