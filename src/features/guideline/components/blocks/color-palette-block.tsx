import { hexToRgb, isValidHex } from '@/lib/color'
import type { BrandColor, GuidelineDocument } from '@/payload-types'
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
			<div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
				{colors.map((color) => (
					<div
						key={color.id}
						className="overflow-hidden rounded-sm border border-border"
					>
						<div
							className="h-24 border-border border-b"
							style={{ backgroundColor: color.hex }}
						/>
						<dl className="space-y-1 bg-background p-3 text-xs leading-5">
							<dt className="font-semibold text-foreground">{color.name}</dt>
							<dd className="text-muted-foreground">HEX {color.hex}</dd>
							{rgbLabel(color.hex) && (
								<dd className="text-muted-foreground">RGB {rgbLabel(color.hex)}</dd>
							)}
							{color.pantone && (
								<dd className="text-muted-foreground">PMS {color.pantone}</dd>
							)}
						</dl>
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
