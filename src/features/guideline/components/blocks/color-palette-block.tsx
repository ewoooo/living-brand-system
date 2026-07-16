import type { BrandColor, GuidelineDocument } from '@/payload-types'
import { ColorSwatch } from '../kit/color-swatch'
import { BlockHeading } from './children/block-heading'

type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]

export function ColorPaletteBlock({
	block,
}: {
	block: Extract<GuidelineBlock, { blockType: 'colorPalette' }>
}) {
	const colors = block.colors.filter(
		(color): color is BrandColor => typeof color === 'object' && color !== null,
	)

	return (
		<section>
			<BlockHeading title={block.title} />
			<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
				{colors.map((color) => (
					<ColorSwatch key={color.id} color={color} />
				))}
			</div>
		</section>
	)
}
