import { type ColorCell, ColorPaletteCell } from './color-palette-cell'

/**
 * 색 견본 여러 개를 한 행에 수평 균등 배치하는 원자. 보통 ColorPalette가 팔레트를 행으로 쪼갤 때 사용.
 * 각 Cell이 flex-1이라 폭을 1:1:…로 나누고, aspectRatio=columns/이 행의 셀 수 → 셀 수가 달라도 모든 행 높이가 (폭/columns)로 동일해진다.
 *
 * @example 한 행에 색 3개(columns=3이라 정사각)
 * <ColorPaletteRow
 * 	colors={[
 * 		{ name: 'Primary', hex: '#1A1A1A' },
 * 		{ name: 'Accent', hex: '#0055FF', pantone: 'Blue C' },
 * 		{ name: 'Base', hex: '#FFFFFF' },
 * 	]}
 * 	columns={3}
 * />
 *
 * @example 마지막 행에 색 1개(columns=3 → 폭의 1/3만 채우고 높이는 다른 행과 동일)
 * <ColorPaletteRow colors={[{ name: 'Primary', hex: '#1A1A1A' }]} columns={3} />
 */
export function ColorPaletteRow({
	colors,
	columns,
}: {
	/** 이 행에 배치할 색 목록 — 각 항목은 이름·HEX·(선택)PMS. 개수가 columns보다 적으면 폭을 그만큼만 채운다. */
	colors: ColorCell[]
	/** 팔레트 전체의 열 수 — 행별 셀 수가 달라도 이 값으로 모든 행 높이를 통일하는 기준. */
	columns: number
}) {
	const aspectRatio = columns / colors.length
	return (
		<div className="flex gap-3">
			{colors.map((color) => (
				<ColorPaletteCell key={color.name} color={color} aspectRatio={aspectRatio} />
			))}
		</div>
	)
}
