import { hexToRgb, isLightColor, isValidHex } from '@/lib/color'
import type { BrandColor, GuidelinePage } from '@/payload-types'
import { BlockHeading } from './children/block-heading'

type GuidelineBlock = NonNullable<GuidelinePage['blocks']>[number]

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
			<div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
				{colors.map((color) => (
					<div
						key={color.id}
						className="aspect-square rounded-sm border border-black/10 p-4 text-xs leading-5"
						style={{
							backgroundColor: color.hex,
							color: isLightColor(color.hex) ? '#000000' : '#FFFFFF',
						}}
					>
						<p className="font-semibold">{color.name}</p>
						<p>HEX {color.hex}</p>
						{rgbLabel(color.hex) && <p>RGB {rgbLabel(color.hex)}</p>}
						{color.pantone && <p>PMS {color.pantone}</p>}
					</div>
				))}
			</div>
		</section>
	)
}

function rgbLabel(hex: string) {
	if (!isValidHex(hex)) return null
	const { r, g, b } = hexToRgb(hex)
	return `${r}/${g}/${b}`
}
