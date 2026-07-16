import type { ColorCell } from './color-palette-cell'
import { ColorPaletteRow } from './color-palette-row'

/**
 * 색상 팔레트 — 색 2차원 배열을 행×열 그리드로 배치. 브랜드 컬러 스펙 페이지에 그대로 드롭인.
 * 여러 팔레트가 같은 columns를 공유하면 행별 셀 수가 달라도(3 vs 5) 모든 행 높이가 통일된다.
 *
 * @example 단일 팔레트
 * <ColorPalette rows={[[{ name: 'Primary', hex: '#1B4D3E' }]]} />
 *
 * @example columns 공유로 여러 팔레트의 행 높이 통일
 * <ColorPalette rows={mainColors} columns={5} />
 * <ColorPalette rows={subColors} columns={5} />
 */
export function ColorPalette({
	rows,
	columns = 5,
}: {
	/** 색 2차원 배열 — 바깥 배열=행, 안쪽 배열=그 행의 셀들(ColorCell={name,hex,pantone?}). */
	rows: ColorCell[][]
	/** 페이지 공용 그리드 단위(기본 5). 여러 팔레트가 공유하면 행별 셀 수가 달라도 행 높이가 통일된다. */
	columns?: number
}) {
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
