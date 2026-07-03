import type { GuidelinePage } from '@/payload-types'
import { ColorPaletteBlock } from './blocks/color-palette-block'
import { ColumnUnitBlock } from './blocks/column-unit-block'
import { MediaShowcaseBlock } from './blocks/media-showcase-block'

export function GuidelineBlocks({ blocks }: { blocks: GuidelinePage['blocks'] }) {
	return (
		<div className="flex flex-col gap-12">
			{blocks?.map((block) =>
				block.blockType === 'mediaShowcase' ? (
					<MediaShowcaseBlock key={block.id} block={block} />
				) : block.blockType === 'colorPalette' ? (
					<ColorPaletteBlock key={block.id} block={block} />
				) : (
					<ColumnUnitBlock key={block.id} block={block} />
				),
			)}
		</div>
	)
}
