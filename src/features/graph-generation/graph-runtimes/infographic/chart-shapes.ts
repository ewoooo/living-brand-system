/**
 * 표현이 받는 데이터의 **성격**. 이것 하나가 묶음의 기준이다.
 *
 * 🔴 「구성비」·「비교」처럼 뜻으로 묶지 않는다. 그건 사람이 붙인 이름이라 같은 데이터가 어느
 *    쪽에도 들어갈 수 있고, 값은 그 이름을 모른다. 데이터가 스스로 말할 수 있는 것은 모양뿐이다.
 * 🔴 항목 **수**는 성격이 아니다. 자리가 모자라면 앞에서부터 쓸 뿐이고(버블 다섯·사각형 셋),
 *    그것 때문에 표현을 숨기면 창작자는 왜 사라졌는지 알 수 없다. 표현은 언제나 전부 서 있는다.
 */
export type ChartDataShape = {
	/** 한 항목이 값 하나만 갖는가(single), 시점마다 여러 계열을 갖는가(multi). */
	series: 'single' | 'multi'
	/** 값이 0~100이어야 뜻이 통하는가. 트랙이 100을 뜻하는 표현이 그렇다. */
	bounded?: boolean
	/** 값이 계속 줄어야 뜻이 통하는가. 큰 것 안에 작은 것이 드는 표현이 그렇다. */
	descending?: boolean
}

/**
 * 같은 데이터를 받는 것끼리의 묶음 키. 🔑 묶음을 따로 선언하지 않는다 — shape가 같으면 같은
 * 묶음이고, 그 안의 차이는 지면뿐이다(세로로 길쭉한 자리인가, 가로로 넓은 자리인가).
 */
export function chartShapeKey(shape: ChartDataShape): string {
	return [shape.series, shape.bounded && 'bounded', shape.descending && 'descending']
		.filter(Boolean)
		.join(':')
}

/** 묶음 제목 — 창작자가 「내 데이터가 이건가」를 바로 판단할 수 있는 말로 적는다. */
export const CHART_SHAPE_LABELS: Record<string, string> = {
	single: '항목별 값',
	'single:bounded': '0~100 비율',
	'single:descending': '줄어드는 값',
	multi: '시점별 여러 계열',
}

/**
 * 표현이 어디서 왔나.
 * - `canon` — 가이드라인 B.11 INFOGRAPHIC 도판에 실린 열두 가지.
 * - `extended` — 정본에 없지만 같은 데이터 성격의 다른 지면을 메우려고 **우리가 더한 것**.
 *
 * 🔴 둘을 섞어 적지 않는다. 브랜드팀이 「이건 규정인가」를 물었을 때 답이 코드에 있어야 한다.
 */
export type InfographicChartSource = 'canon' | 'extended'

export const EXTENDED_CHART_SUFFIX = ' +'
