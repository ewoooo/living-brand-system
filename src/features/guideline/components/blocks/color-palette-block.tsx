import type { BrandColor, GuidelineDocument } from '@/payload-types'
import { GuidelineHeader } from '../globals/guideline-header'
import { ColorSwatch } from './children/color-swatch'
import { GuidelineBlockFrame } from './common/guideline-block-frame'

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
		<GuidelineBlockFrame layout="padded">
			<section>
				<GuidelineHeader variant="block" title={block.title} />
				<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
					{colors.map((color) => (
						<ColorSwatch key={color.id} color={color} />
					))}
				</div>
			</section>
		</GuidelineBlockFrame>
	)
}
