import { hexToRgb, isLightColor, isValidHex } from '@/lib/color'

// ColorPalette의 최소 단위: 색 하나. 부모 Row에서 flex-1로 균등 폭을 받는다(width=fill).
export type ColorCell = { name: string; hex: string; pantone?: string }

export function ColorPaletteCell({
	color,
	aspectRatio = 1,
}: {
	color: ColorCell
	aspectRatio?: number
}) {
	return (
		<div
			className="type-caption-1 flex flex-1 flex-col rounded-sm p-4"
			style={{
				aspectRatio,
				backgroundColor: color.hex,
				color: isLightColor(color.hex) ? '#000000' : '#FFFFFF',
			}}
		>
			<span className="type-caption-1-emphasized">{color.name}</span>
			<span>HEX {color.hex}</span>
			{rgbLabel(color.hex) && <span>RGB {rgbLabel(color.hex)}</span>}
			{color.pantone && <span>PMS {color.pantone}</span>}
		</div>
	)
}

function rgbLabel(hex: string) {
	if (!isValidHex(hex)) return null
	const { r, g, b } = hexToRgb(hex)
	return `${r}/${g}/${b}`
}
