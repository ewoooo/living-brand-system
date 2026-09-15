import type { GraphicModelAdapter } from '@/features/graphic-generation/runtime/graphic-plugin'
import type { VectorPrimitive, VectorScene } from '@/modules/studio-artifact/studio-artifact'
import type {
	ControllerValues,
	StudioControllerRestrictions,
} from '@/modules/studio-controller/controller-definition'
import {
	type ChartData,
	EMPTY_CHART_DATA,
	firstColumn,
	INFOGRAPHIC_SAMPLE_DATA,
	parseChartData,
} from './chart-data'
import {
	HD_INFOGRAPHIC_COLORS,
	type InfographicPaletteId,
	pickSeriesColors,
	pickStrokeColors,
	readableTextColor,
} from './palette'

/**
 * 정본 도판의 12칸. 값은 URL·프로파일에 남으므로 이름을 바꾸지 않는다.
 * 🔴 여기 없는 표현은 오남용이 아니라 **아직 규정되지 않은 것**이다 — 임의로 늘리지 말 것.
 */
export const INFOGRAPHIC_CHART_TYPES = [
	{ id: 'pie', label: '파이' },
	{ id: 'donut', label: '도넛' },
	{ id: 'proportional-circle', label: '비례 원' },
	{ id: 'bubble-cluster', label: '버블 클러스터' },
	{ id: 'bar', label: '막대' },
	{ id: 'bar-track', label: '막대 · 트랙' },
	{ id: 'stacked-column', label: '세로 100% 누적' },
	{ id: 'stacked-bar', label: '가로 100% 누적' },
	{ id: 'line', label: '다계열 선' },
	{ id: 'area', label: '영역' },
	{ id: 'nested-circle', label: '겹친 원' },
	{ id: 'nested-square', label: '겹친 사각형' },
] as const

export type InfographicChartType = (typeof INFOGRAPHIC_CHART_TYPES)[number]['id']

const CHART_TYPE_IDS = INFOGRAPHIC_CHART_TYPES.map(({ id }) => id)

/**
 * 지정 서체. 오남용 ②「지정 서체 외의 다른 서체를 사용하지 않습니다」를 축으로 두지 않는 것으로
 * 지킨다 — 고를 수 없으면 어길 수 없다. 정본은 `theme.css`의 `HD OTF` @font-face다.
 * 🔴 `var(--font-body)`를 쓰지 않는다. 이 값은 SVG·PDF attribute로 그대로 나가 CSS 변수가 풀리지 않는다.
 */
export const INFOGRAPHIC_FONT_FAMILY = '"HD OTF", "Pretendard", sans-serif'

export type InfographicInput = {
	chartType: InfographicChartType
	palette: InfographicPaletteId
	showValueLabels: boolean
	data: ChartData
}

export const INFOGRAPHIC_DEFAULT_CHART_TYPE: InfographicChartType = 'pie'
export const INFOGRAPHIC_DEFAULT_PALETTE: InfographicPaletteId = 'greenNavy'
export const INFOGRAPHIC_DEFAULT_SHOW_VALUE_LABELS = true

export function toInfographicInput(values: ControllerValues): InfographicInput {
	const chartType = pick(values.chartType, CHART_TYPE_IDS, INFOGRAPHIC_DEFAULT_CHART_TYPE)
	return {
		chartType,
		palette: pick(values.palette, ['green', 'greenNavy', 'navy'], INFOGRAPHIC_DEFAULT_PALETTE),
		showValueLabels:
			typeof values.showValueLabels === 'boolean'
				? values.showValueLabels
				: INFOGRAPHIC_DEFAULT_SHOW_VALUE_LABELS,
		// 값이 아직 없을 때만 그 표현의 샘플로 떨어진다. 비운 것은 비운 대로 둔다 — 빈 판이
		// 「데이터가 없다」를 말해 주는데 샘플을 되살리면 지운 것이 되살아난 것처럼 보인다.
		data: parseChartData(
			typeof values.data === 'string' ? values.data : INFOGRAPHIC_SAMPLE_DATA[chartType],
		),
	}
}

function pick<Value extends string>(
	raw: unknown,
	allowed: readonly Value[],
	fallback: Value,
): Value {
	return allowed.includes(raw as Value) ? (raw as Value) : fallback
}

type Box = { x: number; y: number; width: number; height: number }

/**
 * 판 전체가 아니라 여백을 뺀 상자 안에 그린다. 정본 도판이 칸마다 같은 여백을 두고 있고,
 * 상자를 한 번 정해 두면 12종이 서로 다른 좌표계를 발명하지 않는다.
 */
function contentBox(width: number, height: number): Box {
	const margin = Math.min(width, height) * 0.12
	return { x: margin, y: margin, width: width - margin * 2, height: height - margin * 2 }
}

/** 인포그래픽 한 장의 모든 기하를 만든다. 순수 함수라 미리보기와 내보내기가 같은 것을 본다. */
export function createInfographicScene(
	input: InfographicInput,
	viewport: { width: number; height: number },
): VectorScene {
	const box = contentBox(viewport.width, viewport.height)
	return {
		width: viewport.width,
		height: viewport.height,
		background: HD_INFOGRAPHIC_COLORS.white,
		// 데이터가 없으면 빈 판이다 — 입력하는 중에는 정상 상태라 오류로 다루지 않는다.
		primitives: input.data.rows.length === 0 ? [] : CHART_BUILDERS[input.chartType](box, input),
	}
}

type ChartBuilder = (box: Box, input: InfographicInput) => VectorPrimitive[]

const CHART_BUILDERS: Record<InfographicChartType, ChartBuilder> = {
	pie: (box, input) => buildRadialSlices(box, input, 0),
	donut: (box, input) => buildRadialSlices(box, input, 0.55),
	'proportional-circle': buildProportionalCircle,
	'bubble-cluster': buildBubbleCluster,
	bar: (box, input) => buildBars(box, input, false),
	'bar-track': (box, input) => buildBars(box, input, true),
	'stacked-column': buildStackedColumn,
	'stacked-bar': buildStackedBar,
	line: buildLine,
	area: buildArea,
	'nested-circle': buildNestedCircle,
	'nested-square': buildNestedSquare,
}

// ── 공통 유틸 ────────────────────────────────────────────────────────────────

/**
 * 조각에 얹는 글자. 🔑 무엇을 적을지는 표현이 정한다 — 정본 도판이 구성비에는 수치를,
 * 묶음에는 이름을 적는다. 데이터는 둘 다 갖고 있고 표현이 골라 쓴다.
 */
function valueText(value: number): string {
	return `${Math.round(value * 10) / 10}%`
}

function label(
	text: string,
	x: number,
	y: number,
	fontSize: number,
	fill: string,
	anchor: 'start' | 'middle' | 'end' = 'middle',
	fontWeight = 700,
): VectorPrimitive {
	return {
		kind: 'text',
		x,
		// 글자 상자의 세로 중앙을 받아 baseline으로 옮긴다 — cap height 대략 0.35em.
		y: y + fontSize * 0.35,
		text,
		fontFamily: INFOGRAPHIC_FONT_FAMILY,
		fontSize,
		fontWeight,
		fill,
		textAnchor: anchor,
	}
}

/**
 * 칸 안에 들어가는 글자 크기. 🔴 글자 수 × 고정 배수로는 안 된다 — 한글은 라틴·숫자의 두 배 가까이
 * 넓어서 같은 글자 수라도 「Group A」는 들어가고 「서울특별시」는 칸을 넘는다(실제로 넘었다).
 * 정확한 폭은 폰트가 알지만 model은 순수 함수라 측정할 수 없으므로, 글자 종류로 어림한다.
 */
function fitFontSize(text: string, boxWidth: number, max: number): number {
	const ems = [...text].reduce(
		(total, character) =>
			total +
			(/[\u1100-\u11FF\u3000-\u9FFF\uAC00-\uD7AF\uFF00-\uFF60]/.test(character) ? 1 : 0.55),
		0,
	)
	return ems > 0 ? Math.min(max, boxWidth / ems) : max
}

function polylinePath(points: readonly { x: number; y: number }[], close: boolean): string {
	const [first, ...rest] = points
	const body = rest.map(({ x, y }) => `L${round(x)} ${round(y)}`).join('')
	return `M${round(first.x)} ${round(first.y)}${body}${close ? 'Z' : ''}`
}

function round(value: number): number {
	return Math.round(value * 100) / 100
}

/** 부채꼴(innerRatio 0) 또는 도넛 섹터의 path d. 각도는 12시에서 시작해 시계 방향이다. */
function sectorPath(
	cx: number,
	cy: number,
	radius: number,
	innerRatio: number,
	startTurn: number,
	endTurn: number,
): string {
	const inner = radius * innerRatio
	const large = endTurn - startTurn > 0.5 ? 1 : 0
	const outerStart = onCircle(cx, cy, radius, startTurn)
	const outerEnd = onCircle(cx, cy, radius, endTurn)
	if (inner === 0) {
		return `M${round(cx)} ${round(cy)}L${round(outerStart.x)} ${round(outerStart.y)}A${round(radius)} ${round(radius)} 0 ${large} 1 ${round(outerEnd.x)} ${round(outerEnd.y)}Z`
	}
	const innerEnd = onCircle(cx, cy, inner, endTurn)
	const innerStart = onCircle(cx, cy, inner, startTurn)
	return `M${round(outerStart.x)} ${round(outerStart.y)}A${round(radius)} ${round(radius)} 0 ${large} 1 ${round(outerEnd.x)} ${round(outerEnd.y)}L${round(innerEnd.x)} ${round(innerEnd.y)}A${round(inner)} ${round(inner)} 0 ${large} 0 ${round(innerStart.x)} ${round(innerStart.y)}Z`
}

function onCircle(cx: number, cy: number, radius: number, turn: number) {
	const angle = turn * Math.PI * 2 - Math.PI / 2
	return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
}

// ── ① 파이 · ② 도넛 ──────────────────────────────────────────────────────────

function buildRadialSlices(
	box: Box,
	input: InfographicInput,
	innerRatio: number,
): VectorPrimitive[] {
	const values = firstColumn(input.data)
	const sum = values.reduce((total, value) => total + value, 0)
	if (sum <= 0) return []
	const radius = Math.min(box.width, box.height) / 2
	const cx = box.x + box.width / 2
	const cy = box.y + box.height / 2
	const colors = pickSeriesColors(input.palette, values.length)
	const fontSize = radius * 0.13
	const labelRadius = radius * (innerRatio === 0 ? 0.66 : (1 + innerRatio) / 2)
	const primitives: VectorPrimitive[] = []
	let cursor = 0
	values.forEach((value, index) => {
		const span = value / sum
		primitives.push({
			kind: 'path',
			d: sectorPath(cx, cy, radius, innerRatio, cursor, cursor + span),
			fill: colors[index],
		})
		if (input.showValueLabels) {
			const at = onCircle(cx, cy, labelRadius, cursor + span / 2)
			primitives.push(
				label(valueText(value), at.x, at.y, fontSize, readableTextColor(colors[index])),
			)
		}
		cursor += span
	})
	return primitives
}

// ── ③ 비례 원 ────────────────────────────────────────────────────────────────

function buildProportionalCircle(box: Box, input: InfographicInput): VectorPrimitive[] {
	const values = firstColumn(input.data).slice(0, 2)
	const [big, small] = values.length === 2 ? values : [values[0], values[0]]
	if (big <= 0) return []
	const colors = pickSeriesColors(input.palette, 2)
	const base = Math.min(box.width, box.height)
	// 값은 넓이에 비례한다 — 반지름을 값에 비례시키면 큰 쪽이 규정보다 훨씬 커 보인다.
	const bigRadius = base * 0.34
	const smallRadius = bigRadius * Math.sqrt(Math.max(small, 0) / big)
	const bigCenter = { x: box.x + box.width * 0.56, y: box.y + box.height * 0.36 }
	const smallCenter = {
		x: box.x + box.width * 0.18,
		y: box.y + box.height - smallRadius - base * 0.04,
	}
	const primitives: VectorPrimitive[] = [
		{ kind: 'circle', cx: bigCenter.x, cy: bigCenter.y, radius: bigRadius, fill: colors[0] },
		{
			kind: 'circle',
			cx: smallCenter.x,
			cy: smallCenter.y,
			radius: smallRadius,
			fill: colors[1],
		},
	]
	if (!input.showValueLabels) return primitives
	return [
		...primitives,
		label(
			valueText(big),
			bigCenter.x,
			bigCenter.y,
			bigRadius * 0.26,
			readableTextColor(colors[0]),
		),
		label(
			valueText(small),
			smallCenter.x,
			smallCenter.y,
			smallRadius * 0.34,
			readableTextColor(colors[1]),
		),
	]
}

// ── ④ 버블 클러스터 ──────────────────────────────────────────────────────────

/**
 * 원의 자리는 정본 도판의 배치를 그대로 옮긴 **고정 레이아웃**이다.
 * 물리 시뮬레이션으로 풀지 않는다 — 같은 입력에 같은 결과여야 미리보기와 내보내기가 갈리지 않는다.
 */
const CLUSTER_LAYOUT = [
	{ x: 0.54, y: 0.3 },
	{ x: 0.68, y: 0.72 },
	{ x: 0.42, y: 0.76 },
	{ x: 0.2, y: 0.6 },
	{ x: 0.88, y: 0.56 },
] as const

function buildBubbleCluster(box: Box, input: InfographicInput): VectorPrimitive[] {
	// 자리가 고정 레이아웃이라 그보다 많은 항목은 그릴 자리가 없다.
	const rows = input.data.rows.slice(0, CLUSTER_LAYOUT.length)
	const max = Math.max(...rows.map((row) => row.values[0] ?? 0))
	if (max <= 0) return []
	const colors = pickSeriesColors(input.palette, rows.length)
	const base = Math.min(box.width, box.height)
	const primitives: VectorPrimitive[] = []
	rows.forEach((row, index) => {
		const radius = base * 0.3 * Math.sqrt((row.values[0] ?? 0) / max)
		const spot = CLUSTER_LAYOUT[index]
		const cx = box.x + box.width * spot.x
		const cy = box.y + box.height * spot.y
		primitives.push({ kind: 'circle', cx, cy, radius, fill: colors[index] })
		if (input.showValueLabels && row.label) {
			primitives.push(
				label(row.label, cx, cy, radius * 0.44, readableTextColor(colors[index])),
			)
		}
	})
	return primitives
}

// ── ⑤ 막대 · ⑥ 막대 트랙 ────────────────────────────────────────────────────

function buildBars(box: Box, input: InfographicInput, withTrack: boolean): VectorPrimitive[] {
	const rows = input.data.rows
	// 트랙형은 팔레트의 가장 연한 색이 트랙 자리를 가져간다 — 채움은 그 다음 색부터 뽑아야
	// 첫 막대가 트랙과 같은 색이 되어 사라지지 않는다.
	const colors = pickSeriesColors(input.palette, rows.length + 1).slice(withTrack ? 1 : 0)
	const gap = box.width * 0.04
	const barWidth = (box.width - gap * (rows.length - 1)) / rows.length
	// 트랙형은 100%가 판의 높이다. 그냥 막대는 최댓값이 판의 높이다.
	const scaleMax = withTrack ? 100 : Math.max(...rows.map((row) => row.values[0] ?? 0))
	if (scaleMax <= 0) return []
	const fontSize = barWidth * 0.3
	const primitives: VectorPrimitive[] = []
	rows.forEach((row, index) => {
		const value = row.values[0] ?? 0
		const x = box.x + (barWidth + gap) * index
		const filled = Math.max(0, Math.min(value / scaleMax, 1)) * box.height
		if (withTrack) {
			primitives.push({
				kind: 'rect',
				x,
				y: box.y,
				width: barWidth,
				height: box.height,
				fill: HD_INFOGRAPHIC_COLORS.lightGreen,
			})
		}
		primitives.push({
			kind: 'rect',
			x,
			y: box.y + box.height - filled,
			width: barWidth,
			height: filled,
			fill: colors[index],
		})
		if (!input.showValueLabels) return
		primitives.push(
			label(
				valueText(value),
				x + barWidth / 2,
				box.y + box.height - filled + fontSize,
				fontSize,
				readableTextColor(colors[index]),
			),
		)
		// 트랙형에만 이름을 적는다 — 채운 자리와 트랙이 갈려 이름이 설 바닥이 생긴다.
		if (withTrack && row.label) {
			primitives.push(
				label(
					row.label,
					x + barWidth / 2,
					box.y + box.height - fontSize * 0.6,
					fitFontSize(row.label, barWidth * 0.9, fontSize * 0.3),
					readableTextColor(colors[index]),
				),
			)
		}
	})
	return primitives
}

// ── ⑦ 세로 100% 누적 · ⑧ 가로 100% 누적 ─────────────────────────────────────

function buildStackedColumn(box: Box, input: InfographicInput): VectorPrimitive[] {
	const values = firstColumn(input.data)
	const sum = values.reduce((total, value) => total + value, 0)
	if (sum <= 0) return []
	const colors = pickSeriesColors(input.palette, values.length)
	const width = box.width * 0.62
	const x = box.x + (box.width - width) / 2
	const fontSize = width * 0.11
	const primitives: VectorPrimitive[] = []
	let cursor = box.y
	// 정본 도판이 위를 작은 조각으로 시작한다 — 데이터 순서가 곧 쌓이는 순서다.
	values.forEach((value, index) => {
		const height = (value / sum) * box.height
		primitives.push({ kind: 'rect', x, y: cursor, width, height, fill: colors[index] })
		if (input.showValueLabels) {
			primitives.push(
				label(
					valueText(value),
					x + width / 2,
					cursor + height / 2,
					fontSize,
					readableTextColor(colors[index]),
				),
			)
		}
		cursor += height
	})
	return primitives
}

function buildStackedBar(box: Box, input: InfographicInput): VectorPrimitive[] {
	const rows = input.data.rows
	const sum = rows.reduce((total, row) => total + (row.values[0] ?? 0), 0)
	if (sum <= 0) return []
	const colors = pickSeriesColors(input.palette, rows.length)
	const height = box.height * 0.34
	const y = box.y + (box.height - height) / 2
	const fontSize = height * 0.22
	const primitives: VectorPrimitive[] = []
	let cursor = box.x
	rows.forEach((row, index) => {
		const width = ((row.values[0] ?? 0) / sum) * box.width
		primitives.push({ kind: 'rect', x: cursor, y, width, height, fill: colors[index] })
		if (input.showValueLabels && row.label) {
			primitives.push(
				label(
					row.label,
					cursor + width / 2,
					y + height / 2,
					// 좁은 칸에서는 글자가 칸을 넘는다. 칸 너비가 글자 크기의 상한이다.
					fitFontSize(row.label, width * 0.9, fontSize),
					readableTextColor(colors[index]),
				),
			)
		}
		cursor += width
	})
	return primitives
}

// ── ⑨ 다계열 선 ──────────────────────────────────────────────────────────────

/** 한 줄에 칸이 여럿이면 계열이 여럿이다. 가장 짧은 줄이 그릴 수 있는 계열 수를 정한다. */
function seriesCount(data: ChartData): number {
	return Math.min(...data.rows.map((row) => row.values.length))
}

function buildLine(box: Box, input: InfographicInput): VectorPrimitive[] {
	const rows = input.data.rows
	if (rows.length < 2) return []
	const lines = seriesCount(input.data)
	const values = rows.flatMap((row) => row.values.slice(0, lines))
	const min = Math.min(...values)
	const max = Math.max(...values)
	// 눈금은 판을 4~6칸으로 끊는다 — 정본 도판의 -4/0/4/8/12와 같은 간격 감각이다.
	const step = niceStep((max - min) / 4)
	const low = Math.floor(min / step) * step
	const high = Math.max(Math.ceil(max / step) * step, low + step)
	// 축 글자는 데이터가 아니라 좌표계다 — 정본 도판도 값 라벨보다 한참 작게 둔다.
	const fontSize = Math.min(box.width, box.height) * 0.032
	const plot: Box = {
		x: box.x + fontSize * 3.5,
		y: box.y,
		width: box.width - fontSize * 3.5,
		height: box.height - fontSize * 2.4,
	}
	// 선은 면이 아니라 획이다 — 팔레트를 그대로 쓰면 연한 계열이 흰 판에서 사라진다.
	const colors = pickStrokeColors(input.palette, lines)
	const toY = (value: number) =>
		plot.y + plot.height - ((value - low) / (high - low)) * plot.height
	const toX = (index: number) => plot.x + (index / (rows.length - 1)) * plot.width

	const primitives: VectorPrimitive[] = []
	for (let tick = low; tick <= high + step / 2; tick += step) {
		const y = toY(tick)
		primitives.push({
			kind: 'line',
			x1: plot.x,
			y1: y,
			x2: plot.x + plot.width,
			y2: y,
			stroke: HD_INFOGRAPHIC_COLORS.lightGreen,
			strokeWidth: Math.max(1, fontSize * 0.04),
		})
		primitives.push(
			label(
				valueText(tick),
				plot.x - fontSize * 0.5,
				y,
				fontSize,
				HD_INFOGRAPHIC_COLORS.deepGreen,
				'end',
				400,
			),
		)
	}
	rows.forEach((row, index) => {
		if (!row.label) return
		primitives.push(
			label(
				row.label,
				toX(index),
				plot.y + plot.height + fontSize * 1.2,
				fontSize,
				HD_INFOGRAPHIC_COLORS.deepGreen,
				'middle',
				400,
			),
		)
	})
	for (let series = 0; series < lines; series += 1) {
		primitives.push({
			kind: 'path',
			d: polylinePath(
				rows.map((row, index) => ({ x: toX(index), y: toY(row.values[series]) })),
				false,
			),
			stroke: colors[series],
			strokeWidth: Math.max(1.5, fontSize * 0.18),
			fill: 'none',
		})
	}
	return primitives
}

/** 1·2·5의 10의 거듭제곱 배수로 올린다 — 사람이 읽는 눈금은 늘 그 셋 중 하나다. */
function niceStep(rough: number): number {
	if (!Number.isFinite(rough) || rough <= 0) return 1
	const magnitude = 10 ** Math.floor(Math.log10(rough))
	const normalized = rough / magnitude
	const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
	return step * magnitude
}

// ── ⑩ 영역 ───────────────────────────────────────────────────────────────────

function buildArea(box: Box, input: InfographicInput): VectorPrimitive[] {
	const rows = input.data.rows
	if (rows.length < 2) return []
	const areas = seriesCount(input.data)
	const max = Math.max(...rows.flatMap((row) => row.values.slice(0, areas)))
	if (max <= 0) return []
	const colors = pickSeriesColors(input.palette, areas + 1)
	const fontSize = Math.min(box.width, box.height) * 0.09
	const primitives: VectorPrimitive[] = []
	// 큰 값부터 그린다 — 뒤에 그린 작은 영역이 위에 얹혀야 두 계열이 모두 보인다.
	for (let series = 0; series < areas; series += 1) {
		const points = rows.map((row, index) => ({
			x: box.x + (index / (rows.length - 1)) * box.width,
			y: box.y + box.height - (row.values[series] / max) * box.height,
		}))
		const fill = colors[colors.length - 1 - series]
		primitives.push({
			kind: 'path',
			d: polylinePath(
				[
					...points,
					{ x: box.x + box.width, y: box.y + box.height },
					{ x: box.x, y: box.y + box.height },
				],
				true,
			),
			fill,
		})
		const name = input.data.series[series]
		if (!input.showValueLabels || !name) continue
		const last = points[points.length - 1]
		primitives.push(
			label(
				name,
				last.x - fontSize * 0.3,
				last.y + fontSize * 0.7,
				fontSize * 0.45,
				readableTextColor(fill),
				'end',
			),
		)
	}
	return primitives
}

// ── ⑪ 겹친 원 ────────────────────────────────────────────────────────────────

/**
 * 동심원이 아니다 — 세 원이 **아래 가장자리에 맞춰** 겹친다. 그래서 작은 원일수록 아래에 놓이고
 * 큰 원의 위쪽 띠가 드러나며, 그 띠가 라벨이 서는 자리가 된다.
 */
function buildNestedCircle(box: Box, input: InfographicInput): VectorPrimitive[] {
	const rows = input.data.rows
	const values = firstColumn(input.data)
	const max = Math.max(...values)
	if (max <= 0) return []
	const colors = pickSeriesColors(input.palette, rows.length)
	const base = Math.min(box.width, box.height)
	const outer = base / 2
	const cx = box.x + box.width / 2
	const bottom = box.y + box.height / 2 + outer
	const primitives: VectorPrimitive[] = []
	rows.forEach((row, index) => {
		const radius = outer * Math.sqrt((row.values[0] ?? 0) / max)
		primitives.push({ kind: 'circle', cx, cy: bottom - radius, radius, fill: colors[index] })
		if (!input.showValueLabels || !row.label) return
		// 다음 원에 덮이지 않고 남는 위쪽 띠의 한가운데가 이름이 설 자리다.
		const innerDiameter =
			index + 1 < rows.length
				? outer * Math.sqrt((rows[index + 1].values[0] ?? 0) / max) * 2
				: 0
		primitives.push(
			label(
				row.label,
				cx,
				bottom - radius * 2 + (radius * 2 - innerDiameter) / 2,
				base * 0.06,
				readableTextColor(colors[index]),
			),
		)
	})
	return primitives
}

// ── ⑫ 겹친 사각형 ────────────────────────────────────────────────────────────

/** 세 사각형이 면적으로 값을 말한다. 자리는 정본 도판처럼 계단으로 어긋나게 둔다. */
const OVERLAP_ANCHORS = [
	{ x: 0, y: 1 },
	{ x: 0.42, y: 0 },
	{ x: 1, y: 1 },
] as const

function buildNestedSquare(box: Box, input: InfographicInput): VectorPrimitive[] {
	// 자리가 고정이라 그보다 많은 항목은 그릴 자리가 없다.
	const rows = input.data.rows.slice(0, OVERLAP_ANCHORS.length)
	const max = Math.max(...rows.map((row) => row.values[0] ?? 0))
	if (max <= 0) return []
	const colors = pickSeriesColors(input.palette, rows.length)
	const base = Math.min(box.width, box.height)
	const primitives: VectorPrimitive[] = []
	// 큰 것부터 그린다 — 작은 사각형과 그 라벨이 큰 사각형에 덮이지 않게 하는 유일한 순서다.
	// 자리는 데이터 순서가 정하므로(OVERLAP_ANCHORS) 원래 index를 들고 다닌다.
	rows.map((row, index) => ({ row, index }))
		.sort((a, b) => (b.row.values[0] ?? 0) - (a.row.values[0] ?? 0))
		.forEach(({ row, index }) => {
			const side = base * 0.62 * Math.sqrt((row.values[0] ?? 0) / max)
			const anchor = OVERLAP_ANCHORS[index]
			const x = box.x + (box.width - side) * anchor.x
			const y = box.y + (box.height - side) * anchor.y
			primitives.push({ kind: 'rect', x, y, width: side, height: side, fill: colors[index] })
			if (!input.showValueLabels) return
			// 겹치는 도형이라 라벨은 가운데가 아니라 **자기 쪽 모서리**에 붙인다 —
			// 가운데에 두면 뒤에 그려지는 사각형이 그대로 덮는다.
			primitives.push(
				label(
					valueText(row.values[0] ?? 0),
					x + side * 0.1,
					y + side * 0.2,
					side * 0.18,
					readableTextColor(colors[index]),
					'start',
				),
			)
		})
	return primitives
}

const model = {
	createVectorArtifact: (values, viewport) => ({
		kind: 'vector' as const,
		source: createInfographicScene(toInfographicInput(values), viewport),
	}),
	/**
	 * 표현을 고르면 **그 표현의 이상적인 데이터**가 기본값이 된다. 「초기화」가 되돌리는 자리도 여기다.
	 * 🔑 restriction인 이유: binding은 viewport만 받아 값이 바뀌어도 다시 계산되지 않는다.
	 * 🔴 현재 값은 건드리지 않는다 — 표현을 바꿀 때마다 사용자가 넣은 데이터를 덮으면 안 된다.
	 *    포맷이 12종 공통이라 대개 그대로 유효하고, 아니면 초기화가 있다.
	 */
	getRestrictions: (values): StudioControllerRestrictions => ({
		controls: [
			{
				controlId: 'data',
				defaultValue:
					INFOGRAPHIC_SAMPLE_DATA[
						pick(values.chartType, CHART_TYPE_IDS, INFOGRAPHIC_DEFAULT_CHART_TYPE)
					],
			},
		],
	}),
} satisfies GraphicModelAdapter

export default model

export type { ChartData }
export { EMPTY_CHART_DATA, INFOGRAPHIC_SAMPLE_DATA, parseChartData }
