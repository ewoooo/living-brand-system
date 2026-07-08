import type { BrandColor, GuidelinePage } from '@/payload-types'

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
			{block.title && <h2 className="mb-6 font-semibold text-xl">{block.title}</h2>}
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
						{hexToRgbLabel(color.hex) && <p>RGB {hexToRgbLabel(color.hex)}</p>}
						{color.pantone && <p>PMS {color.pantone}</p>}
					</div>
				))}
			</div>
		</section>
	)
}

function parseHex(hex: string) {
	const value = Number.parseInt(hex.replace(/^#/, ''), 16)
	return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff }
}

function hexToRgbLabel(hex: string) {
	const value = hex.replace(/^#/, '')
	if (!/^[0-9a-fA-F]{6}$/.test(value)) return null
	const { r, g, b } = parseHex(hex)
	return `${r}/${g}/${b}`
}

/** 스와치 위 스펙 텍스트의 흑/백 선택용 밝기 판정 (YIQ 근사). */
function isLightColor(hex: string) {
	const { r, g, b } = parseHex(hex)
	return (r * 299 + g * 587 + b * 114) / 1000 > 150
}
