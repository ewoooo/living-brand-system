import type { ReactNode } from 'react'
import type { GuidelineDocument } from '@/payload-types'
import { ColorPaletteBlock } from './color-palette-block'
import { ColumnUnitBlock } from './column-unit-block'
import { DoDontBlock } from './do-dont-block'
import { MediaShowcaseBlock } from './media-showcase-block'

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
				let content: ReactNode

				switch (block.blockType) {
					case 'mediaShowcase':
						content = <MediaShowcaseBlock block={block} />
						break
					case 'colorPalette':
						content = <ColorPaletteBlock block={block} />
						break
					case 'columnUnit':
						content = <ColumnUnitBlock block={block} />
						break
					case 'doDont':
						content = <DoDontBlock block={block} />
						break
					default:
						return null
				}

				return (
					<div key={block.id} data-better-editor-id={betterEditor ? block.id : undefined}>
						{content}
					</div>
				)
			})}
		</div>
	)
}
