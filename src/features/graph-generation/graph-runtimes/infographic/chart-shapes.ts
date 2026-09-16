import type { ChartData } from './chart-data'

/**
 * 표현이 **요구하는 데이터 형태**. 묶음은 이것 하나로 갈린다.
 *
 * 🔴 「구성비」·「비교」·「추이」처럼 뜻으로 묶지 않는다. 그건 사람이 붙인 이름이라 같은 데이터가
 *    어느 쪽에도 들어갈 수 있고, 값은 그 이름을 모른다. 데이터가 스스로 말할 수 있는 것은
 *    **모양뿐이다** — 계열이 몇이고 항목이 몇이며 줄어드는가, 100을 넘는가.
 * 🔑 그래서 같은 형태를 요구하는 표현들이 곧 한 묶음이고, 그 안의 차이는 지면뿐이다.
 */
export type ChartDataShape = {
	/** 한 항목이 값 하나만 갖는가(single), 시점마다 여러 계열을 갖는가(multi). */
	series: 'single' | 'multi'
	minRows: number
	/** 자리가 고정된 표현이 있다 — 버블은 다섯, 겹친 사각형은 셋까지만 그릴 자리가 있다. */
	maxRows?: number
	/** 값이 계속 줄어들어야 하는가. 포함 관계를 그리는 표현이 요구한다. */
	descending?: boolean
	/** 값이 0~100이어야 하는가. 트랙이 100을 뜻하는 표현이 요구한다. */
	bounded?: boolean
}

/**
 * 이 데이터로 그 표현을 그릴 수 있나.
 * 🔴 데이터가 비어 있으면 **전부 허용**한다 — 아직 아무것도 모르는 것이지 안 맞는 것이 아니다.
 */
export function acceptsChartData(shape: ChartDataShape, data: ChartData): boolean {
	if (data.rows.length === 0) return true
	const multi = data.rows.every((row) => row.values.length > 1)
	if ((shape.series === 'multi') !== multi) return false
	if (data.rows.length < shape.minRows) return false
	if (shape.maxRows !== undefined && data.rows.length > shape.maxRows) return false
	const values = data.rows.map((row) => row.values[0] ?? 0)
	if (
		shape.descending &&
		!values.every((value, index) => index === 0 || value < values[index - 1])
	)
		return false
	if (shape.bounded && values.some((value) => value < 0 || value > 100)) return false
	return true
}

/**
 * 표현이 어디서 왔나.
 * - `canon` — 가이드라인 B.11 INFOGRAPHIC 도판에 실린 열두 가지.
 * - `extended` — 정본에 없지만 같은 데이터 형태의 다른 지면을 메우려고 **우리가 더한 것**.
 *
 * 🔴 둘을 섞어 적지 않는다. 브랜드팀이 「이건 규정인가」를 물었을 때 답이 코드에 있어야 한다.
 *    화면에서도 확장 표현은 이름 뒤에 표시가 붙는다.
 */
export type InfographicChartSource = 'canon' | 'extended'

export const EXTENDED_CHART_SUFFIX = ' +'
