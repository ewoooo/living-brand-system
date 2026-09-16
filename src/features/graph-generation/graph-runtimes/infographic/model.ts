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
import type { ChartDataShape, InfographicChartSource } from './chart-shapes'
import {
	HD_INFOGRAPHIC_COLORS,
	type InfographicPaletteId,
	pickSeriesColors,
	pickStrokeColors,
	readableTextColor,
} from './palette'

/**
 * 쓸 수 있는 표현 전부. 값은 URL·프로파일에 남으므로 이름을 바꾸지 않는다.
 *
 * 🔑 `shape`가 이 표현이 받을 수 있는 데이터를 선언한다 — 같은 shape를 요구하는 것들이 곧
 *    한 묶음이고, 그 안의 차이는 지면뿐이다(세로로 길쭉한 자리인가, 가로로 넓은 자리인가).
 * 🔴 `source`가 정본과 확장을 가른다. 새 표현을 정본이라고 적지 말 것 — 근거는 `chart-shapes.ts`.
 */
export const INFOGRAPHIC_CHART_TYPES = [
	{
		id: 'pie',
		label: '파이',
		shape: { series: 'single' },
		source: 'canon',
		usesNameLabels: false,
	},
	{
		id: 'donut',
		label: '도넛',
		shape: { series: 'single' },
		source: 'canon',
		usesNameLabels: false,
	},
	{
		id: 'stacked-column',
		label: '세로 100% 누적',
		shape: { series: 'single' },
		source: 'canon',
		usesNameLabels: false,
	},
	{
		id: 'stacked-bar',
		label: '가로 100% 누적',
		shape: { series: 'single' },
		source: 'canon',
		usesNameLabels: true,
	},
	{
		id: 'bar',
		label: '막대',
		shape: { series: 'single' },
		source: 'canon',
		usesNameLabels: false,
	},
	{
		id: 'bar-horizontal',
		label: '가로 막대',
		shape: { series: 'single' },
		source: 'extended',
		usesNameLabels: true,
	},
	{
		id: 'bubble-cluster',
		label: '버블 클러스터',
		// 자리가 다섯뿐이다(CLUSTER_LAYOUT).
		shape: { series: 'single' },
		source: 'canon',
		usesNameLabels: true,
	},
	{
		id: 'proportional-circle',
		label: '비례 원',
		// 둘의 크기를 견주는 표현이라 셋째 값을 그릴 자리가 없다.
		shape: { series: 'single' },
		source: 'canon',
		usesNameLabels: false,
	},
	{
		id: 'nested-square',
		label: '겹친 사각형',
		// 자리가 셋뿐이다(OVERLAP_ANCHORS).
		shape: { series: 'single' },
		source: 'canon',
		usesNameLabels: false,
	},
	{
		id: 'bar-track',
		label: '막대 · 트랙',
		// 트랙이 100을 뜻한다 — 값이 100을 넘으면 전부 꽉 찬 트랙이 되어 아무것도 못 읽는다.
		shape: { series: 'single', bounded: true },
		source: 'canon',
		usesNameLabels: true,
	},
	{
		id: 'bar-track-horizontal',
		label: '가로 막대 · 트랙',
		shape: { series: 'single', bounded: true },
		source: 'extended',
		usesNameLabels: true,
	},
	{
		id: 'nested-circle',
		label: '겹친 원',
		// 큰 것 안에 작은 것이 들려면 값이 계속 줄어야 한다.
		shape: { series: 'single', descending: true },
		source: 'canon',
		usesNameLabels: true,
	},
	{
		id: 'concentric-circle',
		label: '동심원',
		shape: { series: 'single', descending: true },
		source: 'extended',
		usesNameLabels: true,
	},
	{
		id: 'line',
		label: '다계열 선',
		shape: { series: 'multi' },
		source: 'canon',
		usesNameLabels: false,
	},
	{
		id: 'area',
		label: '영역',
		shape: { series: 'multi' },
		source: 'canon',
		usesNameLabels: true,
	},
] as const satisfies readonly {
	id: string
	label: string
	shape: ChartDataShape
	source: InfographicChartSource
	/**
	 * 항목 이름을 그리는가. 🔴 「이름 표시」 옵션은 이름을 쓰는 표현에서만 살아 있다 —
	 * 파이는 조각에 수치만 적으므로 그 표현에서 이름을 끄고 켜는 스위치는 아무것도 하지 않는다.
	 */
	usesNameLabels: boolean
}[]

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
	/** 항목 이름을 그리는가. 이름을 쓰지 않는 표현에서는 아무 영향이 없다. */
	showNameLabels: boolean
	showValueLabels: boolean
	/** 글자 크기 배율. 표현이 정한 기준 크기에 곱한다. */
	textScale: number
	/**
	 * 수치의 크기를 하나로 맞출 것인가.
	 * 🔑 이름과 다르다 — **이름은 언제나 하나로 맞춘다**(같은 층위의 것이 크기로 갈리면 순서가
	 * 있는 것처럼 읽힌다). 수치는 칸 크기를 따라가는 편이 나을 때가 있어 고를 수 있게 둔다.
	 */
	uniformValueSize: boolean
	data: ChartData
}

export const INFOGRAPHIC_DEFAULT_CHART_TYPE: InfographicChartType = 'pie'
export const INFOGRAPHIC_DEFAULT_PALETTE: InfographicPaletteId = 'greenNavy'
export const INFOGRAPHIC_DEFAULT_SHOW_VALUE_LABELS = true
export const INFOGRAPHIC_DEFAULT_SHOW_NAME_LABELS = true
export const INFOGRAPHIC_DEFAULT_TEXT_SCALE = 1
export const INFOGRAPHIC_DEFAULT_UNIFORM_VALUE_SIZE = true
export const INFOGRAPHIC_TEXT_SCALE_RANGE = { min: 0.5, max: 1.6, step: 0.05 } as const

export function toInfographicInput(values: ControllerValues): InfographicInput {
	const chartType = pick(values.chartType, CHART_TYPE_IDS, INFOGRAPHIC_DEFAULT_CHART_TYPE)
	return {
		chartType,
		palette: pick(values.palette, ['green', 'greenNavy', 'navy'], INFOGRAPHIC_DEFAULT_PALETTE),
		showNameLabels: boolish(values.showNameLabels, INFOGRAPHIC_DEFAULT_SHOW_NAME_LABELS),
		showValueLabels: boolish(values.showValueLabels, INFOGRAPHIC_DEFAULT_SHOW_VALUE_LABELS),
		textScale:
			typeof values.textScale === 'number' && Number.isFinite(values.textScale)
				? Math.min(
						INFOGRAPHIC_TEXT_SCALE_RANGE.max,
						Math.max(INFOGRAPHIC_TEXT_SCALE_RANGE.min, values.textScale),
					)
				: INFOGRAPHIC_DEFAULT_TEXT_SCALE,
		uniformValueSize: boolish(values.uniformValueSize, INFOGRAPHIC_DEFAULT_UNIFORM_VALUE_SIZE),
		// 값이 아직 없을 때만 그 표현의 샘플로 떨어진다. 비운 것은 비운 대로 둔다 — 빈 판이
		// 「데이터가 없다」를 말해 주는데 샘플을 되살리면 지운 것이 되살아난 것처럼 보인다.
		data: parseChartData(
			typeof values.data === 'string' ? values.data : INFOGRAPHIC_SAMPLE_DATA[chartType],
		),
	}
}

function boolish(raw: unknown, fallback: boolean): boolean {
	return typeof raw === 'boolean' ? raw : fallback
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
	donut: (box, input) => buildRadialSlices(box, input, 0.46),
	'proportional-circle': buildProportionalCircle,
	'bubble-cluster': buildBubbleCluster,
	bar: (box, input) => buildBars(box, input, false),
	'bar-horizontal': (box, input) => buildHorizontalBars(box, input, false),
	'bar-track': (box, input) => buildBars(box, input, true),
	'bar-track-horizontal': (box, input) => buildHorizontalBars(box, input, true),
	'stacked-column': buildStackedColumn,
	'stacked-bar': buildStackedBar,
	line: buildLine,
	area: buildArea,
	'nested-circle': buildNestedCircle,
	'concentric-circle': buildConcentricCircle,
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
function textEms(text: string): number {
	return [...text].reduce(
		(total, character) =>
			total +
			(/[\u1100-\u11FF\u3000-\u9FFF\uAC00-\uD7AF\uFF00-\uFF60]/.test(character) ? 1 : 0.55),
		0,
	)
}

/**
 * 여럿이 함께 설 때의 글자 크기. 🔴 각자 칸에 맞춰 줄이면 같은 층위의 것이 크기로 갈려
 * 순서가 있는 것처럼 읽힌다 — 가장 빡빡한 칸이 전체 크기를 정한다.
 */
function sharedFontSize(entries: readonly { text: string; width: number }[], max: number): number {
	return entries.reduce(
		(size, entry) => Math.min(size, fitFontSize(entry.text, entry.width, max)),
		max,
	)
}

/**
 * 수치의 크기.
 *
 * - **맞춤 켜짐** — 전부 한 크기다. 정본 도판이 그렇게 적는다.
 * - **맞춤 꺼짐** — 도형 크기를 따라간다. 큰 조각이 큰 숫자를 갖는 편이 나은 판이 있다.
 *
 * 🔴 「각자 칸에 맞춰 줄인다」로 읽으면 안 된다. 기준 크기가 넉넉하면 어느 칸에도 다 들어가
 *    결국 전부 같은 크기가 되고, 스위치가 아무것도 하지 않는다(실제로 파이에서 그랬다).
 * 🔑 비율은 제곱근으로 눌러 둔다 — 넓이가 1/4인 조각의 글자를 1/4로 줄이면 읽을 수 없다.
 */
function valueFontSizes(
	entries: readonly { text: string; width: number; height?: number; weight?: number }[],
	max: number,
	uniform: boolean,
): number[] {
	// 어느 쪽이든 자기 칸을 넘지는 않는다.
	const fitted = entries.map((entry) =>
		Math.min(fitFontSize(entry.text, entry.width, max), entry.height ?? max),
	)
	if (entries.length === 0) return fitted
	if (uniform) {
		const smallest = Math.min(...fitted)
		return fitted.map(() => smallest)
	}
	const heaviest = Math.max(...entries.map((entry) => entry.weight ?? 1))
	return entries.map((entry, index) =>
		Math.min(
			fitted[index],
			// 작은 조각도 읽혀야 하므로 절반 아래로는 내려가지 않는다.
			max * Math.max(0.5, Math.sqrt((entry.weight ?? 1) / (heaviest || 1))),
		),
	)
}

function fitFontSize(text: string, boxWidth: number, max: number): number {
	const ems = textEms(text)
	return ems > 0 ? Math.min(max, boxWidth / ems) : max
}

/**
 * 점들을 부드럽게 잇는다 — Catmull-Rom을 3차 베지어로 옮긴 것.
 * 🔑 마디가 보이지 않아야 하는 표현(영역)만 쓴다. 꺾은선이 정보인 선 차트는 `polylinePath`.
 */
function smoothPath(points: readonly { x: number; y: number }[]): string {
	if (points.length < 3) return polylinePath(points, false)
	let path = `M${round(points[0].x)} ${round(points[0].y)}`
	for (let index = 0; index < points.length - 1; index += 1) {
		const previous = points[Math.max(0, index - 1)]
		const current = points[index]
		const next = points[index + 1]
		const after = points[Math.min(points.length - 1, index + 2)]
		const control1 = {
			x: current.x + (next.x - previous.x) / 6,
			y: current.y + (next.y - previous.y) / 6,
		}
		const control2 = {
			x: next.x - (after.x - current.x) / 6,
			y: next.y - (after.y - current.y) / 6,
		}
		path += `C${round(control1.x)} ${round(control1.y)},${round(control2.x)} ${round(control2.y)},${round(next.x)} ${round(next.y)}`
	}
	return path
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
	// 🔴 판을 꽉 채우지 않는다 — 정본 도판의 원은 칸의 절반 남짓이고, 그래서 조각 라벨이
	//    도형에 눌리지 않고 읽힌다. 판을 채우면 같은 라벨 크기라도 훨씬 크게 보인다.
	const radius = (Math.min(box.width, box.height) / 2) * 0.72
	const cx = box.x + box.width / 2
	const cy = box.y + box.height / 2
	const colors = pickSeriesColors(input.palette, values.length)
	const fontSize = radius * 0.1 * input.textScale
	const labelRadius = radius * (innerRatio === 0 ? 0.66 : (1 + innerRatio) / 2)
	// 조각이 좁을수록 글자가 설 호가 짧다 — 그 호가 이 조각의 칸 너비다.
	const valueSizes = valueFontSizes(
		values.map((value) => ({
			text: valueText(value),
			width: Math.PI * 2 * labelRadius * (value / sum) * 0.9,
			height: radius * (innerRatio === 0 ? 0.45 : (1 - innerRatio) * 0.7),
			weight: value,
		})),
		fontSize,
		input.uniformValueSize,
	)
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
				label(
					valueText(value),
					at.x,
					at.y,
					valueSizes[index],
					readableTextColor(colors[index]),
				),
			)
		}
		cursor += span
	})
	return primitives
}

/**
 * 원들을 판에 꽉 맞춘다 — 자리와 크기의 **비는 그대로 두고** 전체만 키우거나 줄여 가운데 세운다.
 *
 * 🔑 배치를 판 크기로 직접 계산하면 값 분포에 따라 판이 비거나 넘친다. 단위 좌표로 관계만
 *    정해 두고 마지막에 한 번 맞추면, 어떤 데이터가 와도 판을 꽉 쓴다.
 */
function fitCircles(
	circles: readonly { x: number; y: number; r: number }[],
	box: Box,
): { x: number; y: number; r: number }[] {
	if (circles.length === 0) return []
	const left = Math.min(...circles.map((circle) => circle.x - circle.r))
	const right = Math.max(...circles.map((circle) => circle.x + circle.r))
	const top = Math.min(...circles.map((circle) => circle.y - circle.r))
	const bottom = Math.max(...circles.map((circle) => circle.y + circle.r))
	const width = right - left
	const height = bottom - top
	const scale = Math.min(box.width / (width || 1), box.height / (height || 1))
	const offsetX = box.x + (box.width - width * scale) / 2 - left * scale
	const offsetY = box.y + (box.height - height * scale) / 2 - top * scale
	return circles.map((circle) => ({
		x: circle.x * scale + offsetX,
		y: circle.y * scale + offsetY,
		r: circle.r * scale,
	}))
}

// ── ③ 비례 원 ────────────────────────────────────────────────────────────────

function buildProportionalCircle(box: Box, input: InfographicInput): VectorPrimitive[] {
	const values = firstColumn(input.data).slice(0, 2)
	const [big, small] = values.length === 2 ? values : [values[0], values[0]]
	if (big <= 0) return []
	const colors = pickSeriesColors(input.palette, 2)
	// 값은 넓이에 비례한다 — 반지름을 값에 비례시키면 큰 쪽이 규정보다 훨씬 커 보인다.
	const smallRatio = Math.sqrt(Math.max(small, 0) / big)
	// 🔴 두 원은 **떨어져 선다**(정본 도판). 붙이면 두 덩어리가 한 도형으로 읽힌다.
	//    작은 원은 큰 원의 왼쪽 아래에 놓인다.
	const angle = Math.PI * (152 / 180)
	const distance = (1 + smallRatio) * 1.22
	const [bigCircle, smallCircle] = fitCircles(
		[
			{ x: 0, y: 0, r: 1 },
			{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, r: smallRatio },
		],
		box,
	)
	const valueSizes = valueFontSizes(
		[
			{ text: valueText(big), width: bigCircle.r * 1.4, weight: big },
			{ text: valueText(small), width: smallCircle.r * 1.4, weight: small },
		],
		bigCircle.r * 0.26 * input.textScale,
		input.uniformValueSize,
	)
	const primitives: VectorPrimitive[] = [
		{ kind: 'circle', cx: bigCircle.x, cy: bigCircle.y, radius: bigCircle.r, fill: colors[0] },
		{
			kind: 'circle',
			cx: smallCircle.x,
			cy: smallCircle.y,
			radius: smallCircle.r,
			fill: colors[1],
		},
	]
	if (!input.showValueLabels) return primitives
	return [
		...primitives,
		label(
			valueText(big),
			bigCircle.x,
			bigCircle.y,
			valueSizes[0],
			readableTextColor(colors[0]),
		),
		label(
			valueText(small),
			smallCircle.x,
			smallCircle.y,
			valueSizes[1],
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
	{ x: 0.5, y: 0.26 },
	{ x: 0.76, y: 0.7 },
	{ x: 0.4, y: 0.78 },
	{ x: 0.13, y: 0.52 },
	{ x: 0.9, y: 0.34 },
] as const

/**
 * 단위 좌표에서 원을 얼마나 키울 수 있나. 🔴 자리가 고정이라 값 분포에 따라 이웃끼리 겹친다 —
 * 특례로 몇몇 경우를 막는 대신, 가장 빡빡한 이웃 쌍이 **닿는 선**을 상한으로 삼아 겹침이 생길
 * 자리를 없앤다. 입력이 같으면 결과도 같으므로 미리보기와 내보내기가 갈리지 않는다.
 */
function clusterScale(ratios: readonly number[]): number {
	let scale = Number.POSITIVE_INFINITY
	for (let a = 0; a < ratios.length; a += 1) {
		for (let b = a + 1; b < ratios.length; b += 1) {
			const dx = CLUSTER_LAYOUT[a].x - CLUSTER_LAYOUT[b].x
			const dy = CLUSTER_LAYOUT[a].y - CLUSTER_LAYOUT[b].y
			const sum = ratios[a] + ratios[b]
			if (sum > 0) scale = Math.min(scale, Math.hypot(dx, dy) / sum)
		}
	}
	return Number.isFinite(scale) ? scale : 0.3
}

function buildBubbleCluster(box: Box, input: InfographicInput): VectorPrimitive[] {
	// 자리가 고정 레이아웃이라 그보다 많은 항목은 그릴 자리가 없다.
	const rows = input.data.rows.slice(0, CLUSTER_LAYOUT.length)
	const max = Math.max(...rows.map((row) => row.values[0] ?? 0))
	if (max <= 0) return []
	const colors = pickSeriesColors(input.palette, rows.length)
	const ratios = rows.map((row) => Math.sqrt((row.values[0] ?? 0) / max))
	// 자리는 단위 좌표로 관계만 정하고, 겹치지 않을 최대 크기를 구한 뒤 판에 맞춘다.
	const scale = clusterScale(ratios)
	const circles = fitCircles(
		ratios.map((ratio, index) => ({
			x: CLUSTER_LAYOUT[index].x,
			y: CLUSTER_LAYOUT[index].y,
			r: ratio * scale,
		})),
		box,
	)
	const nameSize = sharedFontSize(
		rows.map((row, index) => ({ text: row.label, width: circles[index].r * 1.5 })),
		Math.max(...circles.map((circle) => circle.r)) * 0.44 * input.textScale,
	)
	const primitives: VectorPrimitive[] = []
	rows.forEach((row, index) => {
		const circle = circles[index]
		primitives.push({
			kind: 'circle',
			cx: circle.x,
			cy: circle.y,
			radius: circle.r,
			fill: colors[index],
		})
		// 원 안에 드는 폭은 지름보다 좁다 — 가장자리로 갈수록 세로 여유가 없다.
		if (input.showNameLabels && row.label) {
			primitives.push(
				label(row.label, circle.x, circle.y, nameSize, readableTextColor(colors[index])),
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
	const gap = box.width * 0.055
	const barWidth = (box.width - gap * (rows.length - 1)) / rows.length
	// 트랙형은 100%가 판의 높이다. 그냥 막대는 최댓값이 판의 높이다.
	const scaleMax = withTrack ? 100 : Math.max(...rows.map((row) => row.values[0] ?? 0))
	if (scaleMax <= 0) return []
	const fontSize = barWidth * 0.3 * input.textScale
	// 칸 너비는 같지만 막대 높이가 달라, 낮은 막대에서는 글자가 막대를 넘는다.
	const valueSizes = valueFontSizes(
		rows.map((row) => {
			const value = row.values[0] ?? 0
			return {
				text: valueText(value),
				width: barWidth * 0.9,
				height: Math.max(0, Math.min(value / scaleMax, 1)) * box.height * 0.7,
				weight: value,
			}
		}),
		fontSize,
		input.uniformValueSize,
	)
	// 이름은 길이가 달라 가장 긴 것이 크기를 정한다.
	// 🔴 상한을 기준 크기의 0.3배로 박아 두면 폭이 남아도 글자가 안 커져 읽히지 않는다 —
	//    상한은 「수치보다 작다」만 뜻하고, 실제 크기는 칸 너비가 정하게 둔다.
	const nameSize = sharedFontSize(
		rows.map((row) => ({ text: row.label, width: barWidth * 0.86 })),
		fontSize * 0.62,
	)
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
		// 🔴 값은 막대 **바닥**에 앉는다(정본 도판) — 위에 얹으면 막대가 낮을 때 판 위로 뜬다.
		//    트랙형은 이름이 바닥을 쓰므로 그 위에 선다.
		primitives.push(
			label(
				valueText(value),
				x + barWidth / 2,
				box.y +
					box.height -
					(withTrack ? nameSize * 2.1 : valueSizes[index] * 0.9) -
					valueSizes[index] * 0.5,
				valueSizes[index],
				readableTextColor(colors[index]),
			),
		)
		// 트랙형에만 이름을 적는다 — 채운 자리와 트랙이 갈려 이름이 설 바닥이 생긴다.
		if (withTrack && input.showNameLabels && row.label) {
			primitives.push(
				label(
					row.label,
					x + barWidth / 2,
					box.y + box.height - nameSize * 0.9,
					nameSize,
					readableTextColor(colors[index]),
				),
			)
		}
	})
	return primitives
}

/**
 * 가로 막대 — 정본 밖(확장)이다. 세로 막대와 **같은 데이터, 같은 말**이고 지면만 다르다:
 * 항목 이름이 길거나 항목 수가 많을 때 세로 막대는 이름이 설 자리를 잃는다.
 */
function buildHorizontalBars(
	box: Box,
	input: InfographicInput,
	withTrack: boolean,
): VectorPrimitive[] {
	const rows = input.data.rows
	const colors = pickSeriesColors(input.palette, rows.length + 1).slice(withTrack ? 1 : 0)
	const gap = box.height * 0.04
	const barHeight = (box.height - gap * (rows.length - 1)) / rows.length
	const scaleMax = withTrack ? 100 : Math.max(...rows.map((row) => row.values[0] ?? 0))
	if (scaleMax <= 0) return []
	const fontSize = barHeight * 0.4 * input.textScale
	const padding = fontSize * 0.5

	// 막대마다 길이가 달라 글자가 쓸 수 있는 폭도 다르다 — 크기를 맞추려면 먼저 다 재야 한다.
	const bars = rows.map((row, index) => {
		const value = row.values[0] ?? 0
		return {
			row,
			value,
			valueLabel: valueText(value),
			y: box.y + (barHeight + gap) * index,
			filled: Math.max(0, Math.min(value / scaleMax, 1)) * box.width,
			color: colors[index],
		}
	})
	const valueSizes = valueFontSizes(
		bars.map((bar) => ({
			text: bar.valueLabel,
			width: bar.filled - padding * 2,
			weight: bar.value,
		})),
		fontSize,
		input.uniformValueSize,
	)
	const valueSizeOf = (bar: (typeof bars)[number]) => valueSizes[bars.indexOf(bar)]
	// 🔴 값이 쓰고 남은 폭만 이름이 갖는다. 겹쳐서 둘 다 못 읽게 되느니 하나만 읽히는 쪽이 낫다.
	const nameWidthOf = (bar: (typeof bars)[number]) =>
		bar.filled - textEms(bar.valueLabel) * valueSizeOf(bar) - padding * 3
	const nameSize = sharedFontSize(
		bars
			.filter((bar) => nameWidthOf(bar) > fontSize * 0.6)
			.map((bar) => ({ text: bar.row.label, width: nameWidthOf(bar) })),
		fontSize,
	)

	const primitives: VectorPrimitive[] = []
	for (const bar of bars) {
		if (withTrack) {
			primitives.push({
				kind: 'rect',
				x: box.x,
				y: bar.y,
				width: box.width,
				height: barHeight,
				fill: HD_INFOGRAPHIC_COLORS.lightGreen,
			})
		}
		primitives.push({
			kind: 'rect',
			x: box.x,
			y: bar.y,
			width: bar.filled,
			height: barHeight,
			fill: bar.color,
		})
		const textColor = readableTextColor(bar.color)
		if (input.showValueLabels) {
			primitives.push(
				label(
					bar.valueLabel,
					box.x + bar.filled - padding,
					bar.y + barHeight / 2,
					valueSizeOf(bar),
					textColor,
					'end',
				),
			)
		}
		// 이름은 막대 머리에, 값은 막대 끝에 — 가로 막대를 쓰는 이유가 이름이라 이름을 먼저 읽는다.
		// 🔴 막대가 짧으면 이름이 설 자리가 없다. 트랙형은 트랙이 판 끝까지 있으므로 채운 자리
		//    **밖**에 적을 수 있다 — 이름을 통째로 잃는 것보다 낫다.
		if (input.showNameLabels && bar.row.label) {
			const insideName = nameWidthOf(bar) > fontSize * 0.6
			if (insideName || withTrack) {
				primitives.push(
					label(
						bar.row.label,
						box.x + (insideName ? padding : bar.filled + padding),
						bar.y + barHeight / 2,
						nameSize,
						insideName ? textColor : HD_INFOGRAPHIC_COLORS.deepGreen,
						'start',
					),
				)
			}
		}
	}
	return primitives
}

// ── ⑦ 세로 100% 누적 · ⑧ 가로 100% 누적 ─────────────────────────────────────

function buildStackedColumn(box: Box, input: InfographicInput): VectorPrimitive[] {
	const values = firstColumn(input.data)
	const sum = values.reduce((total, value) => total + value, 0)
	if (sum <= 0) return []
	const colors = pickSeriesColors(input.palette, values.length)
	const width = box.width * 0.44
	const x = box.x + (box.width - width) / 2
	const fontSize = width * 0.11 * input.textScale
	// 조각 높이가 값에 비례한다 — 얇은 조각이 글자를 담을 수 있는 높이가 곧 상한이다.
	const valueSizes = valueFontSizes(
		values.map((value) => ({
			text: valueText(value),
			width: width * 0.9,
			height: (value / sum) * box.height * 0.7,
			weight: value,
		})),
		fontSize,
		input.uniformValueSize,
	)
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
					valueSizes[index],
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
	const height = box.height * 0.16
	const y = box.y + (box.height - height) / 2
	const fontSize = height * 0.22 * input.textScale
	// 좁은 칸에서는 글자가 칸을 넘는다 — 가장 좁은 칸이 모든 이름의 크기를 정한다.
	const nameSize = sharedFontSize(
		rows.map((row) => ({
			text: row.label,
			width: ((row.values[0] ?? 0) / sum) * box.width * 0.9,
		})),
		fontSize,
	)
	const primitives: VectorPrimitive[] = []
	let cursor = box.x
	rows.forEach((row, index) => {
		const width = ((row.values[0] ?? 0) / sum) * box.width
		primitives.push({ kind: 'rect', x: cursor, y, width, height, fill: colors[index] })
		if (input.showNameLabels && row.label) {
			primitives.push(
				label(
					row.label,
					cursor + width / 2,
					y + height / 2,
					nameSize,
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
	const fontSize = Math.min(box.width, box.height) * 0.032 * input.textScale
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
			// 보조선은 데이터가 아니라 좌표계다 — 점선이 그 층위를 말한다. 색만 연하게 하면
			// 흰 판에서 사라지고(오남용 ①), 실선이면 데이터 선과 같은 층위로 읽힌다.
			stroke: HD_INFOGRAPHIC_COLORS.ecoGreen,
			strokeWidth: Math.max(1, fontSize * 0.04),
			dash: [fontSize * 0.18, fontSize * 0.28],
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
	const fontSize = Math.min(box.width, box.height) * 0.09 * input.textScale
	const primitives: VectorPrimitive[] = []
	/**
	 * 머릿수치 — 마지막 시점에서 **첫 계열이 마지막 계열보다 얼마나 앞섰나**.
	 * 🔑 정본 도판의 「+24%」가 바로 이 값이다(100 − 76). 카피가 아니라 데이터에서 나오므로
	 *    값을 바꾸면 따라 움직인다. 계열이 하나면 견줄 것이 없어 적지 않는다.
	 */
	if (input.showValueLabels && areas > 1) {
		const last = rows[rows.length - 1].values
		const lead = last[0] - last[areas - 1]
		primitives.push(
			label(
				`${lead > 0 ? '+' : ''}${valueText(lead)}`,
				box.x,
				box.y + fontSize * 0.6,
				fontSize * 1.6,
				HD_INFOGRAPHIC_COLORS.deepGreen,
				'start',
			),
		)
	}
	// 큰 값부터 그린다 — 뒤에 그린 작은 영역이 위에 얹혀야 두 계열이 모두 보인다.
	for (let series = 0; series < areas; series += 1) {
		const plotTop = box.y + (input.showValueLabels && areas > 1 ? box.height * 0.28 : 0)
		const plotHeight = box.y + box.height - plotTop
		const points = rows.map((row, index) => ({
			x: box.x + (index / (rows.length - 1)) * box.width,
			y: plotTop + plotHeight - (row.values[series] / max) * plotHeight,
		}))
		const fill = colors[colors.length - 1 - series]
		primitives.push({
			kind: 'path',
			// 정본 도판은 시점을 잇는 선이 **곡선**이다 — 꺾은선은 선 차트의 몫이고,
			// 영역은 「쌓여 올라가는 흐름」을 말하므로 마디가 보이면 안 된다.
			d: `${smoothPath(points)}L${round(box.x + box.width)} ${round(box.y + box.height)}L${round(box.x)} ${round(box.y + box.height)}Z`,
			fill,
		})
		// 끝점의 점 — 「지금 여기까지」를 찍는다.
		const tip = points[points.length - 1]
		primitives.push({
			kind: 'circle',
			cx: tip.x,
			cy: tip.y,
			radius: Math.max(1.5, fontSize * 0.09),
			fill: HD_INFOGRAPHIC_COLORS.deepGreen,
		})
		const name = input.data.series[series]
		if (!input.showNameLabels || !name) continue
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
	// 이름이 서는 띠의 폭이 원마다 다르다 — 가장 좁은 띠가 모든 이름의 크기를 정한다.
	const nameSize = sharedFontSize(
		rows.map((row) => ({
			text: row.label,
			width: outer * Math.sqrt((row.values[0] ?? 0) / max) * 1.2,
		})),
		base * 0.06 * input.textScale,
	)
	const primitives: VectorPrimitive[] = []
	rows.forEach((row, index) => {
		const radius = outer * Math.sqrt((row.values[0] ?? 0) / max)
		primitives.push({ kind: 'circle', cx, cy: bottom - radius, radius, fill: colors[index] })
		if (!input.showNameLabels || !row.label) return
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
				nameSize,
				readableTextColor(colors[index]),
			),
		)
	})
	return primitives
}

/**
 * 동심원 — 정본 밖(확장)이다. 겹친 원과 **같은 포함 관계**를 말하지만 중심을 맞춘다:
 * 바닥 정렬은 아래쪽에 무게가 쏠려 가로로 넓은 자리에서 판이 비어 보인다.
 */
function buildConcentricCircle(box: Box, input: InfographicInput): VectorPrimitive[] {
	const rows = input.data.rows
	const max = Math.max(...firstColumn(input.data))
	if (max <= 0) return []
	const colors = pickSeriesColors(input.palette, rows.length)
	const base = Math.min(box.width, box.height)
	const outer = base / 2
	const cx = box.x + box.width / 2
	const cy = box.y + box.height / 2
	const nameSize = sharedFontSize(
		rows.map((row) => ({
			text: row.label,
			width: outer * Math.sqrt((row.values[0] ?? 0) / max) * 1.2,
		})),
		base * 0.06 * input.textScale,
	)
	const primitives: VectorPrimitive[] = []
	rows.forEach((row, index) => {
		const radius = outer * Math.sqrt((row.values[0] ?? 0) / max)
		primitives.push({ kind: 'circle', cx, cy, radius, fill: colors[index] })
		if (!input.showNameLabels || !row.label) return
		// 다음 원에 덮이지 않고 남는 위쪽 고리의 한가운데가 이름이 설 자리다.
		const innerRadius =
			index + 1 < rows.length ? outer * Math.sqrt((rows[index + 1].values[0] ?? 0) / max) : 0
		primitives.push(
			label(
				row.label,
				cx,
				cy - (radius + innerRadius) / 2,
				nameSize,
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
	const sideOf = (value: number) => base * 0.62 * Math.sqrt(value / max)
	// 사각형 크기가 곧 값이라 맞춤을 끄면 수치도 사각형을 따라간다.
	const valueSizes = valueFontSizes(
		rows.map((row) => ({
			text: valueText(row.values[0] ?? 0),
			width: sideOf(row.values[0] ?? 0) * 0.8,
			weight: row.values[0] ?? 0,
		})),
		base * 0.11 * input.textScale,
		input.uniformValueSize,
	)
	const primitives: VectorPrimitive[] = []
	// 큰 것부터 그린다 — 작은 사각형과 그 라벨이 큰 사각형에 덮이지 않게 하는 유일한 순서다.
	// 자리는 데이터 순서가 정하므로(OVERLAP_ANCHORS) 원래 index를 들고 다닌다.
	rows.map((row, index) => ({ row, index }))
		.sort((a, b) => (b.row.values[0] ?? 0) - (a.row.values[0] ?? 0))
		.forEach(({ row, index }) => {
			const side = sideOf(row.values[0] ?? 0)
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
					valueSizes[index],
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
	/**
	 * 🔴 표현 **선택지는 좁히지 않는다**. 데이터에 맞지 않는다고 숨기면 창작자는 왜 사라졌는지
	 *    알 수 없고, 자리가 모자란 것은 앞에서부터 쓰면 그만이다. 대신 같은 성격끼리 묶어
	 *    보여 준다(`shape`).
	 */
	getRestrictions: (values): StudioControllerRestrictions => {
		const chartType = pick(values.chartType, CHART_TYPE_IDS, INFOGRAPHIC_DEFAULT_CHART_TYPE)
		const chart = INFOGRAPHIC_CHART_TYPES.find((candidate) => candidate.id === chartType)
		return {
			controls: [
				// 이름을 쓰지 않는 표현에서는 「이름 표시」가 아무것도 하지 않는다 — 잠근다.
				...(chart?.usesNameLabels === false
					? [{ controlId: 'showNameLabels', availability: 'disabled' as const }]
					: []),
				{ controlId: 'data', defaultValue: INFOGRAPHIC_SAMPLE_DATA[chartType] },
			],
		}
	},
} satisfies GraphicModelAdapter

export default model

export type { ChartData }
export { EMPTY_CHART_DATA, INFOGRAPHIC_SAMPLE_DATA, parseChartData }
