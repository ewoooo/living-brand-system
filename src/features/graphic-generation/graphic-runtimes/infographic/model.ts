import type { GraphicModelAdapter } from '@/features/graphic-generation/runtime/graphic-plugin'
import type { VectorPrimitive, VectorScene } from '@/modules/studio-artifact/studio-artifact'
import type { ControllerValues } from '@/modules/studio-controller/controller-definition'
import {
	HD_INFOGRAPHIC_COLORS,
	type InfographicPaletteId,
	pickSeriesColors,
	readableTextColor,
} from './palette'
import {
	type CategorySeries,
	CLUSTER,
	COMPARISON,
	COMPARISON_GROUP_NAMES,
	COMPARISON_GROUPED,
	GROWTH,
	NESTED,
	OVERLAP,
	PART_TO_WHOLE,
	STACK_HORIZONTAL,
	STACK_VERTICAL,
	TREND,
	TWO_PART,
} from './sample-data'

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
}

export const INFOGRAPHIC_DEFAULT_INPUT: InfographicInput = {
	chartType: 'pie',
	palette: 'greenNavy',
	showValueLabels: true,
}

export function toInfographicInput(values: ControllerValues): InfographicInput {
	return {
		chartType: pick(
			values.chartType,
			INFOGRAPHIC_CHART_TYPES.map(({ id }) => id),
			INFOGRAPHIC_DEFAULT_INPUT.chartType,
		),
		palette: pick(
			values.palette,
			['green', 'greenNavy', 'navy'],
			INFOGRAPHIC_DEFAULT_INPUT.palette,
		),
		showValueLabels:
			typeof values.showValueLabels === 'boolean'
				? values.showValueLabels
				: INFOGRAPHIC_DEFAULT_INPUT.showValueLabels,
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
	return {
		x: margin,
		y: margin,
		width: width - margin * 2,
		height: height - margin * 2,
	}
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
		primitives: CHART_BUILDERS[input.chartType](box, input),
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

function total(series: CategorySeries): number {
	return series.reduce((sum, { value }) => sum + value, 0)
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
	const radius = Math.min(box.width, box.height) / 2
	const cx = box.x + box.width / 2
	const cy = box.y + box.height / 2
	const colors = pickSeriesColors(input.palette, PART_TO_WHOLE.length)
	const sum = total(PART_TO_WHOLE)
	const fontSize = radius * 0.13
	const labelRadius = radius * (innerRatio === 0 ? 0.66 : (1 + innerRatio) / 2)
	const primitives: VectorPrimitive[] = []
	let cursor = 0
	PART_TO_WHOLE.forEach((slice, index) => {
		const span = slice.value / sum
		primitives.push({
			kind: 'path',
			d: sectorPath(cx, cy, radius, innerRatio, cursor, cursor + span),
			fill: colors[index],
		})
		if (input.showValueLabels) {
			const at = onCircle(cx, cy, labelRadius, cursor + span / 2)
			primitives.push(
				label(slice.label, at.x, at.y, fontSize, readableTextColor(colors[index])),
			)
		}
		cursor += span
	})
	return primitives
}

// ── ③ 비례 원 ────────────────────────────────────────────────────────────────

function buildProportionalCircle(box: Box, input: InfographicInput): VectorPrimitive[] {
	const colors = pickSeriesColors(input.palette, TWO_PART.length)
	const base = Math.min(box.width, box.height)
	const [big, small] = TWO_PART
	// 값은 넓이에 비례한다 — 반지름을 값에 비례시키면 큰 쪽이 규정보다 훨씬 커 보인다.
	const bigRadius = base * 0.34
	const smallRadius = bigRadius * Math.sqrt(small.value / big.value)
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
		label(big.label, bigCenter.x, bigCenter.y, bigRadius * 0.26, readableTextColor(colors[0])),
		label(
			small.label,
			smallCenter.x,
			smallCenter.y,
			smallRadius * 0.34,
			readableTextColor(colors[1]),
		),
	]
}

// ── ④ 버블 클러스터 ──────────────────────────────────────────────────────────

/**
 * 다섯 원의 자리는 정본 도판의 배치를 그대로 옮긴 **고정 레이아웃**이다.
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
	const colors = pickSeriesColors(input.palette, CLUSTER.length)
	const base = Math.min(box.width, box.height)
	const max = Math.max(...CLUSTER.map(({ value }) => value))
	const primitives: VectorPrimitive[] = []
	CLUSTER.forEach((bubble, index) => {
		const radius = base * 0.3 * Math.sqrt(bubble.value / max)
		const spot = CLUSTER_LAYOUT[index]
		const cx = box.x + box.width * spot.x
		const cy = box.y + box.height * spot.y
		primitives.push({ kind: 'circle', cx, cy, radius, fill: colors[index] })
		if (input.showValueLabels) {
			primitives.push(
				label(bubble.label, cx, cy, radius * 0.44, readableTextColor(colors[index])),
			)
		}
	})
	return primitives
}

// ── ⑤ 막대 · ⑥ 막대 트랙 ────────────────────────────────────────────────────

function buildBars(box: Box, input: InfographicInput, withTrack: boolean): VectorPrimitive[] {
	const series = withTrack ? COMPARISON_GROUPED : COMPARISON
	// 트랙형은 팔레트의 가장 연한 색이 트랙 자리를 가져간다 — 채움은 그 다음 색부터 뽑아야
	// 첫 막대가 트랙과 같은 색이 되어 사라지지 않는다.
	const colors = pickSeriesColors(input.palette, series.length + 1).slice(withTrack ? 1 : 0)
	const gap = box.width * 0.04
	const barWidth = (box.width - gap * (series.length - 1)) / series.length
	// 트랙형은 100%가 판의 높이다. 그냥 막대는 최댓값이 판의 높이다.
	const scaleMax = withTrack ? 100 : Math.max(...series.map(({ value }) => value))
	const fontSize = barWidth * 0.3
	const primitives: VectorPrimitive[] = []
	series.forEach((bar, index) => {
		const x = box.x + (barWidth + gap) * index
		const filled = (bar.value / scaleMax) * box.height
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
				bar.label,
				x + barWidth / 2,
				box.y + box.height - filled + fontSize,
				fontSize,
				readableTextColor(colors[index]),
			),
		)
		if (withTrack) {
			primitives.push(
				label(
					COMPARISON_GROUP_NAMES[index],
					x + barWidth / 2,
					box.y + box.height - fontSize * 0.6,
					fontSize * 0.3,
					readableTextColor(colors[index]),
				),
			)
		}
	})
	return primitives
}

// ── ⑦ 세로 100% 누적 · ⑧ 가로 100% 누적 ─────────────────────────────────────

function buildStackedColumn(box: Box, input: InfographicInput): VectorPrimitive[] {
	const colors = pickSeriesColors(input.palette, STACK_VERTICAL.length)
	const sum = total(STACK_VERTICAL)
	const width = box.width * 0.62
	const x = box.x + (box.width - width) / 2
	const fontSize = width * 0.11
	const primitives: VectorPrimitive[] = []
	let cursor = box.y
	// 정본 도판이 위를 작은 조각으로 시작한다 — 배열 순서가 곧 쌓이는 순서다.
	STACK_VERTICAL.forEach((part, index) => {
		const height = (part.value / sum) * box.height
		primitives.push({ kind: 'rect', x, y: cursor, width, height, fill: colors[index] })
		if (input.showValueLabels) {
			primitives.push(
				label(
					part.label,
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
	const colors = pickSeriesColors(input.palette, STACK_HORIZONTAL.length)
	const sum = total(STACK_HORIZONTAL)
	const height = box.height * 0.34
	const y = box.y + (box.height - height) / 2
	const fontSize = height * 0.22
	const primitives: VectorPrimitive[] = []
	let cursor = box.x
	STACK_HORIZONTAL.forEach((part, index) => {
		const width = (part.value / sum) * box.width
		primitives.push({ kind: 'rect', x: cursor, y, width, height, fill: colors[index] })
		if (input.showValueLabels) {
			primitives.push(
				label(
					part.label,
					cursor + width / 2,
					y + height / 2,
					// 좁은 칸에서는 글자가 칸을 넘는다. 칸 너비가 글자 크기의 상한이다.
					Math.min(fontSize, width / (part.label.length * 0.62)),
					readableTextColor(colors[index]),
				),
			)
		}
		cursor += width
	})
	return primitives
}

// ── ⑨ 다계열 선 ──────────────────────────────────────────────────────────────

function buildLine(box: Box, input: InfographicInput): VectorPrimitive[] {
	const colors = pickSeriesColors(input.palette, TREND.lines.length)
	const values = TREND.lines.flatMap(({ values: line }) => line)
	const min = Math.min(...values)
	const max = Math.max(...values)
	// 눈금은 4%씩 끊는다 — 정본 도판의 -4/0/4/8/12와 같은 간격이다.
	const step = 4
	const low = Math.floor(min / step) * step
	const high = Math.ceil(max / step) * step
	// 축 글자는 데이터가 아니라 좌표계다 — 정본 도판도 값 라벨보다 한참 작게 둔다.
	const fontSize = Math.min(box.width, box.height) * 0.032
	const plot: Box = {
		x: box.x + fontSize * 3.5,
		y: box.y,
		width: box.width - fontSize * 3.5,
		height: box.height - fontSize * 2.4,
	}
	const toY = (value: number) =>
		plot.y + plot.height - ((value - low) / (high - low)) * plot.height
	const toX = (index: number) => plot.x + (index / (TREND.ticks.length - 1)) * plot.width

	const primitives: VectorPrimitive[] = []
	for (let tick = low; tick <= high; tick += step) {
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
				`${tick}%`,
				plot.x - fontSize * 0.5,
				y,
				fontSize,
				HD_INFOGRAPHIC_COLORS.deepGreen,
				'end',
				400,
			),
		)
	}
	TREND.ticks.forEach((tick, index) => {
		primitives.push(
			label(
				tick,
				toX(index),
				plot.y + plot.height + fontSize * 1.2,
				fontSize,
				HD_INFOGRAPHIC_COLORS.deepGreen,
				'middle',
				400,
			),
		)
	})
	TREND.lines.forEach((line, index) => {
		primitives.push({
			kind: 'path',
			d: polylinePath(
				line.values.map((value, tick) => ({ x: toX(tick), y: toY(value) })),
				false,
			),
			stroke: colors[colors.length - 1 - index],
			strokeWidth: Math.max(1.5, fontSize * 0.18),
			fill: 'none',
		})
	})
	return primitives
}

// ── ⑩ 영역 ───────────────────────────────────────────────────────────────────

function buildArea(box: Box, input: InfographicInput): VectorPrimitive[] {
	const colors = pickSeriesColors(input.palette, GROWTH.areas.length + 1)
	const fontSize = Math.min(box.width, box.height) * 0.09
	const plot: Box = {
		x: box.x,
		y: box.y + box.height * 0.34,
		width: box.width,
		height: box.height * 0.66,
	}
	const primitives: VectorPrimitive[] = []
	// 큰 값부터 그린다 — 뒤에 그린 작은 영역이 위에 얹혀야 두 계열이 모두 보인다.
	GROWTH.areas.forEach((area, index) => {
		const points = area.values.map((value, tick) => ({
			x: plot.x + (tick / (area.values.length - 1)) * plot.width,
			y: plot.y + plot.height - value * plot.height,
		}))
		const fill = colors[colors.length - 1 - index]
		primitives.push({
			kind: 'path',
			d: polylinePath(
				[
					...points,
					{ x: plot.x + plot.width, y: plot.y + plot.height },
					{ x: plot.x, y: plot.y + plot.height },
				],
				true,
			),
			fill,
		})
		if (!input.showValueLabels) return
		const last = points[points.length - 1]
		primitives.push(
			label(
				area.label,
				last.x - fontSize * 0.3,
				last.y + fontSize * 0.7,
				fontSize * 0.45,
				readableTextColor(fill),
				'end',
			),
		)
	})
	if (input.showValueLabels) {
		primitives.unshift(
			label(
				GROWTH.headline,
				box.x,
				box.y + fontSize * 0.6,
				fontSize * 1.6,
				HD_INFOGRAPHIC_COLORS.deepGreen,
				'start',
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
	const colors = pickSeriesColors(input.palette, NESTED.length)
	const base = Math.min(box.width, box.height)
	const outer = base / 2
	const cx = box.x + box.width / 2
	const bottom = box.y + box.height / 2 + outer
	const max = Math.max(...NESTED.map(({ value }) => value))
	const primitives: VectorPrimitive[] = []
	NESTED.forEach((ring, index) => {
		const radius = outer * Math.sqrt(ring.value / max)
		primitives.push({ kind: 'circle', cx, cy: bottom - radius, radius, fill: colors[index] })
		if (!input.showValueLabels) return
		const inner =
			index + 1 < NESTED.length ? outer * Math.sqrt(NESTED[index + 1].value / max) * 2 : 0
		primitives.push(
			label(
				ring.label,
				cx,
				bottom - radius * 2 + (radius * 2 - inner) / 2,
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
	const colors = pickSeriesColors(input.palette, OVERLAP.length)
	const base = Math.min(box.width, box.height)
	const max = Math.max(...OVERLAP.map(({ value }) => value))
	const primitives: VectorPrimitive[] = []
	// 큰 것부터 그린다 — 작은 사각형과 그 라벨이 큰 사각형에 덮이지 않게 하는 유일한 순서다.
	// 자리는 배열 순서가 정하므로(OVERLAP_ANCHORS) 원래 index를 들고 다닌다.
	const byDescendingValue = OVERLAP.map((square, index) => ({ square, index })).sort(
		(a, b) => b.square.value - a.square.value,
	)
	byDescendingValue.forEach(({ square, index }) => {
		const side = base * 0.62 * Math.sqrt(square.value / max)
		const anchor = OVERLAP_ANCHORS[index]
		const x = box.x + (box.width - side) * anchor.x
		const y = box.y + (box.height - side) * anchor.y
		primitives.push({ kind: 'rect', x, y, width: side, height: side, fill: colors[index] })
		if (input.showValueLabels) {
			// 겹치는 도형이라 라벨은 가운데가 아니라 **자기 쪽 모서리**에 붙인다 —
			// 가운데에 두면 뒤에 그려지는 사각형이 그대로 덮는다.
			primitives.push(
				label(
					square.label,
					x + side * 0.1,
					y + side * 0.2,
					side * 0.18,
					readableTextColor(colors[index]),
					'start',
				),
			)
		}
	})
	return primitives
}

const model = {
	createVectorArtifact: (values, viewport) => ({
		kind: 'vector' as const,
		source: createInfographicScene(toInfographicInput(values), viewport),
	}),
} satisfies GraphicModelAdapter

export default model
