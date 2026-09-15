import type { InfographicChartType } from './model'

/**
 * 12종이 **한 포맷**을 쓴다 — 줄이 항목이고, 칸은 탭이나 쉼표로 가른다.
 *
 * ```
 * 라벨	값
 * 라벨	값1	값2   ← 칸이 더 있으면 계열이 여럿이다(선·영역만 쓴다)
 * ```
 *
 * 🔑 차트마다 포맷을 따로 두지 않은 이유: 표현을 바꿀 때마다 데이터를 다시 적어야 하면
 *    「같은 데이터를 다르게 본다」가 성립하지 않는다. 남는 칸은 그 표현이 안 쓸 뿐이다.
 * 🔑 첫 줄의 둘째 칸부터가 숫자가 아니면 머리글로 읽는다 — 엑셀에서 복사하면 대개 그 모양이다.
 */
export type ChartData = {
	/** 계열 이름. 머리글이 없으면 비어 있다. */
	series: readonly string[]
	rows: readonly { label: string; values: readonly number[] }[]
}

export const EMPTY_CHART_DATA: ChartData = { series: [], rows: [] }

function splitCells(line: string): string[] {
	return line.split(line.includes('\t') ? '\t' : ',').map((cell) => cell.trim())
}

function toNumber(cell: string): number | null {
	// 붙여넣은 값에는 천 단위 쉼표 대신 %·공백이 섞인다. 쉼표는 이미 칸을 가르는 데 쓰였다.
	const parsed = Number(cell.replace(/%/g, '').trim())
	return cell.trim() !== '' && Number.isFinite(parsed) ? parsed : null
}

export function parseChartData(text: string): ChartData {
	const lines = text
		.split('\n')
		.map((line) => line.trimEnd())
		.filter((line) => line.trim() !== '')
	if (lines.length === 0) return EMPTY_CHART_DATA

	const first = splitCells(lines[0])
	/**
	 * 머리글인가. 두 신호 중 하나면 머리글이다.
	 * - 첫 칸이 비었다 — 표를 복사하면 좌상단이 비는 것이 관례다.
	 * - 둘째 칸부터가 숫자가 아니다.
	 * 🔴 두 번째만으로는 부족하다. `09`·`2024` 같은 계열 이름은 숫자로 읽힌다(실제로 밟았다).
	 *    첫 칸을 채운 머리글(`구분	09	08`)은 데이터로 읽히지만, 그때는 첫 칸을 비우면 된다.
	 */
	const isHeader =
		first.length > 1 &&
		(first[0] === '' || first.slice(1).every((cell) => toNumber(cell) === null))
	const series = isHeader ? first.slice(1) : []

	const rows = lines.slice(isHeader ? 1 : 0).flatMap((line) => {
		const cells = splitCells(line)
		const values = cells.slice(1).map(toNumber)
		// 값이 하나도 없는 줄은 항목이 아니다 — 주석이나 빈 머리글로 보고 버린다.
		if (values.length === 0 || values.every((value) => value === null)) return []
		return [{ label: cells[0], values: values.map((value) => value ?? 0) }]
	})

	return { series, rows }
}

/** 첫 계열만 쓰는 표현(대부분)이 보는 값. */
export function firstColumn(data: ChartData): number[] {
	return data.rows.map((row) => row.values[0] ?? 0)
}

/**
 * 표현마다 「이상적인 데이터」. 표현을 고르면 이 값이 기본값이 되고, 초기화가 되돌리는 자리도 여기다.
 * 🔴 값은 정본 도판(B.11 INFOGRAPHIC OVERVIEW)이 각 칸에 싣고 있는 것 그대로다.
 */
export const INFOGRAPHIC_SAMPLE_DATA: Record<InfographicChartType, string> = {
	pie: '항목 A\t34\n항목 B\t33\n항목 C\t12\n항목 D\t12\n항목 E\t9',
	donut: '항목 A\t34\n항목 B\t33\n항목 C\t12\n항목 D\t12\n항목 E\t9',
	'proportional-circle': '전체\t67\n일부\t33',
	'bubble-cluster': 'A\t46\nB\t22\nC\t14\nD\t10\nE\t8',
	bar: '1분기\t26\n2분기\t49\n3분기\t78\n4분기\t58',
	'bar-track': 'Group A Area\t54\nGroup B Area\t82\nGroup C Area\t27\nGroup D Area\t64',
	'stacked-column': '기타\t10\n서비스\t25\n제품\t55\n부품\t10',
	'stacked-bar': 'Group A\t15\nGroup B\t55\nGroup C\t30',
	line: '\t계열 1\t계열 2\t계열 3\n2025.03\t3\t1.5\t0\n2025.06\t10\t5\t0.5\n2025.09\t3.5\t-0.5\t-2.5\n2026.03\t9\t5.5\t4',
	area: '\t09\t08\n1\t0\t0\n2\t18\t12\n3\t62\t45\n4\t90\t68\n5\t100\t76',
	'nested-circle': 'C\t100\nB\t55\nA\t22',
	'nested-square': '항목 A\t54\n항목 B\t82\n항목 C\t32',
}
