import type { ColorCell } from './color-palette-cell'
import { ColorPaletteRow } from './color-palette-row'

// h개의 Row를 수직 균등 배치. rows = 색 2차원 배열(행 × 열).
// columns = 페이지 공용 그리드 단위(예: 5). 이 값을 여러 팔레트가 공유하면
// 행별 셀 수가 달라도(3 vs 5) 모든 행 높이가 동일해진다 — 팔레트끼리 참조 없이 상수만 공유.
export function ColorPalette({ rows, columns = 5 }: { rows: ColorCell[][]; columns?: number }) {
	return (
		<div className="flex flex-col gap-3">
			{rows.map((row) => (
				<ColorPaletteRow
					key={row.map((color) => color.name).join('-')}
					colors={row}
					columns={columns}
				/>
			))}
		</div>
	)
}
