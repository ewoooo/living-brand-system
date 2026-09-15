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
 *
 * 🔑 12종이 **서로 다른 데이터**를 갖는다. 같은 값을 돌려 쓰면 「이 표현이 무엇에 쓰이는가」를
 *    샘플이 말해 주지 못하고, 조각 수·분포가 같아 표현끼리 구별도 안 된다.
 * 🔴 라벨은 회사·제품을 특정하지 않는 일반 명사다. 그럴듯한 실적처럼 읽히면 샘플이 아니라
 *    자료가 되어 버린다.
 */
export const INFOGRAPHIC_SAMPLE_DATA: Record<InfographicChartType, string> = {
	// 구성비 — 조각이 많아도 읽히는 표현이라 다섯을 싣는다.
	pie: '아시아\t34\n유럽\t33\n북미\t12\n중동\t12\n기타\t9',
	// 같은 구성비지만 가운데가 비어 조각 수가 적을 때 낫다.
	donut: '직판\t42\n대리점\t28\n온라인\t19\n기타\t11',
	// 둘의 크기 비교. 셋 이상이면 버블 클러스터가 맞다.
	'proportional-circle': '달성\t67\n미달\t33',
	// 크기만 견주는 여러 항목 — 순서도 축도 없다.
	'bubble-cluster': '대형\t52\n중형\t31\n소형\t24\n특수\t18\n기타\t11',
	// 서로 독립인 값. 합이 100이 아니어도 된다.
	bar: '1분기\t26\n2분기\t49\n3분기\t78\n4분기\t58',
	// 이름이 길어 세로 막대에 안 들어갈 때. 정본 밖(확장)이다.
	'bar-horizontal': '설계 부문\t72\n생산 부문\t58\n품질 부문\t45\n물류 부문\t31',
	// 각 항목이 자기 100%를 갖는다 — 달성률처럼 상한이 정해진 값.
	'bar-track': '생산\t54\n품질\t82\n납기\t27\n안전\t64',
	// 같은 달성률을 가로로. 정본 밖(확장)이다.
	'bar-track-horizontal': '안전 관리\t88\n납기 준수\t64\n원가 절감\t41\n에너지 절감\t26',
	// 하나의 전체를 세로로 가른다.
	'stacked-column': '기타\t10\n경비\t25\n재료비\t55\n노무비\t10',
	// 하나의 전체를 가로로 가른다 — 조각이 적고 이름이 길 때.
	'stacked-bar': '연구\t15\n생산\t55\n관리\t30',
	// 시계열 여러 계열. 첫 칸이 비어 있어 둘째 칸부터 계열 이름이다.
	line: '\t매출\t영업이익\t수주\n2025.03\t3\t1.5\t0\n2025.06\t10\t5\t0.5\n2025.09\t3.5\t-0.5\t-2.5\n2026.03\t9\t5.5\t4',
	// 쌓아 올라가는 두 계열 — 값 자체보다 늘어나는 모양이 정보다.
	area: '\t누적\t기준\n1월\t0\t0\n2월\t18\t12\n3월\t62\t45\n4월\t90\t68\n5월\t100\t76',
	// 포함 관계 — 큰 것 안에 작은 것이 든다.
	'nested-circle': '전체\t100\n유효\t55\n핵심\t22',
	// 같은 포함 관계를 중심 맞춰서. 정본 밖(확장)이다.
	'concentric-circle': '전사\t100\n사업부\t62\n팀\t30',
	// 면적으로 규모를 견준다. 자리가 셋뿐이다.
	'nested-square': '국내\t54\n아시아\t82\n기타\t32',
}
