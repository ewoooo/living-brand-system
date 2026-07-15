import { type ColorCell, ColorPaletteCell } from './color-palette-cell'

// w개의 Cell을 수평 균등 배치. Cell이 flex-1이라 폭을 1:1:...로 나눈다.
// aspectRatio = columns / 이 행의 셀 수 → 모든 행 높이가 (폭/columns)로 동일해진다.
export function ColorPaletteRow({ colors, columns }: { colors: ColorCell[]; columns: number }) {
	const aspectRatio = columns / colors.length
	return (
		<div className="flex gap-3">
			{colors.map((color) => (
				<ColorPaletteCell key={color.name} color={color} aspectRatio={aspectRatio} />
			))}
		</div>
	)
}
