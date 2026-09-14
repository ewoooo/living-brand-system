/**
 * 정본 도판(B.11 INFOGRAPHIC OVERVIEW)이 각 차트에 싣고 있는 값 그대로다.
 *
 * 🔴 여기가 **데이터가 들어오는 단 한 자리**다. 지금은 상수지만 실제 입력 경로(붙여넣기·업로드
 *    무엇이 되든)가 생기면 이 모양을 채워 주면 되고 기하 코드는 손대지 않는다.
 *    컨트롤러 계약에 배열을 받는 control kind가 없어 지금은 축으로 뺄 수 없다.
 */
export type CategorySeries = readonly { label: string; value: number }[]

export type TimeSeries = {
	readonly ticks: readonly string[]
	readonly lines: readonly { label: string; values: readonly number[] }[]
}

/** 합이 100인 구성비. 파이·도넛·누적이 함께 쓴다. */
export const PART_TO_WHOLE: CategorySeries = [
	{ label: '34%', value: 34 },
	{ label: '33%', value: 33 },
	{ label: '12%', value: 12 },
	{ label: '12%', value: 12 },
	{ label: '9%', value: 9 },
]

export const TWO_PART: CategorySeries = [
	{ label: '67%', value: 67 },
	{ label: '33%', value: 33 },
]

export const CLUSTER: CategorySeries = [
	{ label: 'A', value: 46 },
	{ label: 'B', value: 22 },
	{ label: 'C', value: 14 },
	{ label: 'D', value: 10 },
	{ label: 'E', value: 8 },
]

/** 서로 독립인 값들. 합이 100이 아니다. */
export const COMPARISON: CategorySeries = [
	{ label: '26%', value: 26 },
	{ label: '49%', value: 49 },
	{ label: '78%', value: 78 },
	{ label: '58%', value: 58 },
]

export const COMPARISON_GROUPED: CategorySeries = [
	{ label: '54%', value: 54 },
	{ label: '82%', value: 82 },
	{ label: '27%', value: 27 },
	{ label: '64%', value: 64 },
]

export const COMPARISON_GROUP_NAMES = [
	'Group A Area',
	'Group B Area',
	'Group C Area',
	'Group D Area',
] as const

export const STACK_VERTICAL: CategorySeries = [
	{ label: '10%', value: 10 },
	{ label: '25%', value: 25 },
	{ label: '55%', value: 55 },
	{ label: '10%', value: 10 },
]

export const STACK_HORIZONTAL: CategorySeries = [
	{ label: 'Group A', value: 15 },
	{ label: 'Group B', value: 55 },
	{ label: 'Group C', value: 30 },
]

export const TREND: TimeSeries = {
	ticks: ['2025.03', '2025.06', '2025.09', '2026.03'],
	lines: [
		{ label: '', values: [3, 10, 3.5, 9] },
		{ label: '', values: [1.5, 5, -0.5, 5.5] },
		{ label: '', values: [0, 0.5, -2.5, 4] },
	],
}

export const GROWTH = {
	headline: '+24%',
	areas: [
		{ label: '09', values: [0, 0.18, 0.62, 0.9, 1] },
		{ label: '08', values: [0, 0.12, 0.45, 0.68, 0.76] },
	],
} as const

export const NESTED: CategorySeries = [
	{ label: 'C', value: 100 },
	{ label: 'B', value: 55 },
	{ label: 'A', value: 22 },
]

export const OVERLAP: CategorySeries = [
	{ label: '54%', value: 54 },
	{ label: '82%', value: 82 },
	{ label: '32%', value: 32 },
]
