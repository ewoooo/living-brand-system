import { z } from 'zod'
import type { GraphicModelAdapter } from '@/features/graphic-generation/runtime/graphic-plugin'
import type { VectorSceneArtifact } from '@/modules/studio-artifact/studio-artifact'
import {
	type ControllerControlValue,
	type ControllerRuntimeBindings,
	type ControllerValues,
	isControllerPadValue,
} from '@/modules/studio-controller/controller-definition'
import {
	KEY_VISUAL_PATTERN_COLORWAYS,
	KEY_VISUAL_PATTERN_DEFAULT_INPUT,
	KEY_VISUAL_PATTERN_DIRECTIONS,
	KEY_VISUAL_PATTERN_REFERENCE_BASE,
	KEY_VISUAL_PATTERN_VIEWPOINTS,
	type KeyVisualPatternColorwayId,
} from './definition'

export { KEY_VISUAL_PATTERN_DEFAULT_INPUT, KEY_VISUAL_PATTERN_REFERENCE_BASE } from './definition'

/**
 * 🔴 캔버스 크기 경계 — 원본과 다른 유일한 구조적 결정이다.
 *
 * 브랜드팀 원본은 「작성자가 입력한 실제 크기」를 따로 들고 있고 화면에는 720px로 축소해서만
 * 보여줬다(targetCw/targetCh + previewScale + PREVIEW_MAX_DIM). 이 리포는 그 세 개념을 갖지 않는다:
 * 미리보기는 뷰포트 크기로 씬을 만들고, export는 `getGraphicStudioVectorArtifact`가 요청 크기로 씬을
 * 처음부터 다시 계산한다. 즉 크기는 이미 export 경계가 소유한다.
 *
 * 그래서 여기서는 **viewport를 곧 실제 크기로 간주하고** 축별 스케일(width/720, height/720)을 그대로
 * 적용한다. previewScale류를 되살리면 export가 소유한 것을 두 곳에서 정하게 된다.
 */

const directionIds = KEY_VISUAL_PATTERN_DIRECTIONS.map((option) => option.value)
const viewpointIds = KEY_VISUAL_PATTERN_VIEWPOINTS.map((option) => option.value)
/** Object.keys는 키 타입을 좁혀 주지 않는다 — 조합의 정본은 definition의 표 하나다. */
const colorwayIds = Object.keys(KEY_VISUAL_PATTERN_COLORWAYS) as KeyVisualPatternColorwayId[]

export const keyVisualPatternInputSchema = z.strictObject({
	direction: z.enum(directionIds),
	viewpoint: z.enum(viewpointIds),
	colorway: z.enum(colorwayIds),
	columnGap: z.number().min(10).max(30),
	rowGap: z.number().min(10).max(30),
	variableWeight: z.boolean(),
	minWeight: z.number().min(1).max(10),
	maxWeight: z.number().min(1).max(20),
	origin: z.strictObject({
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
	}),
	lineLength: z.number().min(1).max(200),
	horizontalMargin: z.number().min(0).max(200),
	verticalMargin: z.number().min(0).max(200),
	minCellGap: z.number().min(0).max(100),
	lengthFillRatio: z.number().min(0).max(1),
	depthGamma: z.number().min(1).max(6),
	depthScaleMin: z.number().min(0.01).max(1),
})

export type KeyVisualPatternInput = z.infer<typeof keyVisualPatternInputSchema>

/** 알 수 없는 선택지는 기본으로 떨어진다 — 저장된 값이 낡아도 화면은 뜬다. */
function resolveOption<Id extends string>(
	value: ControllerControlValue,
	allowed: readonly Id[],
	fallback: Id,
): Id {
	return typeof value === 'string' && (allowed as readonly string[]).includes(value)
		? (value as Id)
		: fallback
}

/**
 * Controller 값을 Key Visual Pattern 입력으로 바꾸고 검증한다.
 * 컨트롤이 없는 7개 값은 기본값 스프레드에서 그대로 온다 — 사용자가 못 바꾸지만 계산에는 쓰인다.
 */
export function toKeyVisualPatternInput(values: ControllerValues): KeyVisualPatternInput {
	const base = KEY_VISUAL_PATTERN_DEFAULT_INPUT
	const origin = values.origin
	return keyVisualPatternInputSchema.parse({
		...base,
		direction: resolveOption(values.direction, directionIds, base.direction),
		viewpoint: resolveOption(values.viewpoint, viewpointIds, base.viewpoint),
		colorway: resolveOption(values.colorway, colorwayIds, base.colorway),
		columnGap: values.columnGap ?? base.columnGap,
		rowGap: values.rowGap ?? base.rowGap,
		variableWeight: values.variableWeight ?? base.variableWeight,
		minWeight: values.minWeight ?? base.minWeight,
		maxWeight: values.maxWeight ?? base.maxWeight,
		// pad 값이 없으면 기본 기준점이다 — 위 필드들의 `?? base.x`와 같은 폴백이고,
		// 그냥 흘리면 명시적 undefined가 스프레드한 기본값을 덮어 parse가 던진다.
		origin: isControllerPadValue(origin)
			? { x: (origin.x + 1) / 2, y: (origin.y + 1) / 2 }
			: base.origin,
	})
}

type Point = {
	x: number
	y: number
}

export type KeyVisualPatternDash = {
	x1: number
	y1: number
	x2: number
	y2: number
	weight: number
}

export type KeyVisualPatternScene = {
	width: number
	height: number
	backgroundColor: string
	lineColor: string
	origin: Point
	dashes: KeyVisualPatternDash[]
}

/**
 * 기준 px control을 현재 캔버스 px로 환산한 값. 🔴 스케일이 축별로 셋이다 — 가로 간격은 폭 비율,
 * 세로 간격은 높이 비율, 축과 무관한 값(선 길이·최소 간격·두께)은 평균 비율을 쓴다.
 * 비정방 캔버스에서 x·y 압축 하한이 비대칭이 되는 것은 원본 동작이므로 보정하지 않는다.
 */
type KeyVisualPatternMetrics = {
	columns: number
	rows: number
	columnGap: number
	rowGap: number
	horizontalMargin: number
	verticalMargin: number
	lineLength: number
	minCellGap: number
	minLineWeight: number
	maxLineWeight: number
}

type AxisLayout = {
	positions: number[]
	scales: number[]
	gaps: number[]
}

export function createKeyVisualPatternScene(
	input: KeyVisualPatternInput,
	viewport: { width: number; height: number },
): KeyVisualPatternScene {
	const colorway = KEY_VISUAL_PATTERN_COLORWAYS[input.colorway]
	const metrics = createMetrics(input, viewport)
	const { origin, columnIndex, rowIndex } = snapOrigin(input, viewport, metrics)
	// 입체가 아니면 축 레이아웃 자체를 만들지 않는다 — 평면은 균등 격자다.
	const layout =
		input.viewpoint === 'perspective'
			? {
					row: computeAxisLayout({
						count: metrics.rows,
						gap: metrics.rowGap,
						minPos: metrics.verticalMargin,
						originIndex: rowIndex,
						minCellGap: metrics.minCellGap,
						depthGamma: input.depthGamma,
						depthScaleMin: input.depthScaleMin,
					}),
					column: computeAxisLayout({
						count: metrics.columns,
						gap: metrics.columnGap,
						minPos: metrics.horizontalMargin,
						originIndex: columnIndex,
						minCellGap: metrics.minCellGap,
						depthGamma: input.depthGamma,
						depthScaleMin: input.depthScaleMin,
					}),
				}
			: null
	const spanX = (metrics.columns - 1) * metrics.columnGap
	const spanY = (metrics.rows - 1) * metrics.rowGap
	const flatSafeGap = Math.min(metrics.columnGap, metrics.rowGap)
	const dashes: KeyVisualPatternDash[] = []

	for (let row = 0; row < metrics.rows; row++) {
		for (let column = 0; column < metrics.columns; column++) {
			const position = getGridPosition(metrics, layout, row, column)
			const angle = getLineAngle(input, metrics, position, origin, row, column)
			const weight = input.variableWeight
				? getLineWeight(metrics, position, origin, spanX, spanY)
				: metrics.minLineWeight
			// 선이 작아지는 이유는 둘이다: 기준점에서 멀어져서(depthScale), 옆 칸을 침범하지 않으려고
			// (safetyScale). 더 많이 줄이는 쪽 하나를 길이·두께에 똑같이 곱해 비율을 지킨다.
			// 🔴 평면에도 걸린다 — localGap이 없으면 공칭 간격으로 떨어지고, 기본값에서 이미 0.51배다.
			const safeGap = position.localGap ?? flatSafeGap
			const safetyScale =
				metrics.lineLength > 0
					? clamp((safeGap * input.lengthFillRatio) / metrics.lineLength, 0, 1)
					: 0
			const finalScale = Math.min(position.depthScale, safetyScale)
			const length = metrics.lineLength * finalScale
			const halfX = Math.cos(angle) * length * 0.5
			const halfY = Math.sin(angle) * length * 0.5

			dashes.push({
				x1: position.x + halfX,
				y1: position.y + halfY,
				x2: position.x - halfX,
				y2: position.y - halfY,
				weight: weight * finalScale,
			})
		}
	}

	return {
		width: viewport.width,
		height: viewport.height,
		backgroundColor: colorway.background,
		lineColor: colorway.line,
		origin,
		dashes,
	}
}

function createMetrics(
	input: KeyVisualPatternInput,
	viewport: { width: number; height: number },
): KeyVisualPatternMetrics {
	const widthScale = viewport.width / KEY_VISUAL_PATTERN_REFERENCE_BASE
	const heightScale = viewport.height / KEY_VISUAL_PATTERN_REFERENCE_BASE
	const averageScale = (widthScale + heightScale) / 2
	const columnGap = input.columnGap * widthScale
	const rowGap = input.rowGap * heightScale
	const columns = getAxisCount(input.horizontalMargin, input.columnGap)
	const rows = getAxisCount(input.verticalMargin, input.rowGap)

	return {
		columns,
		rows,
		columnGap,
		rowGap,
		// 칸을 다 채우고 남는 공간을 반씩 나눠 여백을 대칭으로 만든다 — 입력 여백과 다른 값이 될 수 있다.
		horizontalMargin: (viewport.width - (columns - 1) * columnGap) / 2,
		verticalMargin: (viewport.height - (rows - 1) * rowGap) / 2,
		lineLength: input.lineLength * averageScale,
		minCellGap: input.minCellGap * averageScale,
		minLineWeight: input.minWeight * averageScale,
		maxLineWeight: input.maxWeight * averageScale,
	}
}

/**
 * 칸 개수는 기준 공간(720)에서 센다. 스케일된 간격으로 나누면 대수적으로 같은 식인데도 부동소수
 * 오차가 floor를 하나 떨어뜨리고 홀수 강제가 또 하나를 깎아서, 뷰포트 폭에 따라 개수가 2씩 튄다.
 *
 * 짝수면 정중앙 칸이 없으므로 항상 홀수로 만든다(넘치지 않게 하나 줄인다).
 * 🔴 하한 1은 여백이 기준 공간을 다 먹었을 때 대응이다 — 원본은 그 경계에서 -1을 만들어 루프가 아예
 *    돌지 않는다. 1도 홀수라 정중앙 칸은 남는다.
 */
function getAxisCount(referenceMargin: number, gap: number) {
	const raw = Math.floor((KEY_VISUAL_PATTERN_REFERENCE_BASE - referenceMargin * 2) / gap) + 1
	return Math.max(1, raw % 2 === 0 ? raw - 1 : raw)
}

/**
 * 기준점은 항상 칸에 스냅된다. 그 칸은 압축되지 않으므로 입체에서도 기준 행·열은 수평·수직을
 * 유지하고, 각도·두께 계산도 이 스냅된 좌표를 쓴다(원시 pad 좌표가 아니다).
 */
function snapOrigin(
	input: KeyVisualPatternInput,
	viewport: { width: number; height: number },
	metrics: KeyVisualPatternMetrics,
) {
	const columnIndex = snapIndex(
		input.origin.x * viewport.width,
		metrics.columnGap,
		metrics.horizontalMargin,
		metrics.columns,
	)
	const rowIndex = snapIndex(
		input.origin.y * viewport.height,
		metrics.rowGap,
		metrics.verticalMargin,
		metrics.rows,
	)
	return {
		columnIndex,
		rowIndex,
		origin: {
			x: metrics.horizontalMargin + columnIndex * metrics.columnGap,
			y: metrics.verticalMargin + rowIndex * metrics.rowGap,
		} satisfies Point,
	}
}

function snapIndex(value: number, gap: number, offset: number, count: number) {
	// 🔴 뷰포트가 0이면 간격도 0이 된다. 0으로 나눈 NaN은 clamp를 통과해 씬 전체를 NaN으로 만든다.
	if (gap <= 0) return 0
	return clamp(Math.round((value - offset) / gap), 0, count - 1)
}

/**
 * 기준점 칸을 그대로 두고 거기서 첫 칸 쪽·마지막 칸 쪽으로 각각 따로 압축한다.
 * 행의 y는 행 번호에서만, 열의 x는 열 번호에서만 나오므로 같은 행은 같은 y를 유지한다.
 */
function computeAxisLayout({
	count,
	gap,
	minPos,
	originIndex,
	minCellGap,
	depthGamma,
	depthScaleMin,
}: {
	count: number
	gap: number
	minPos: number
	originIndex: number
	minCellGap: number
	depthGamma: number
	depthScaleMin: number
}): AxisLayout {
	const positions = new Array<number>(count)
	const scales = new Array<number>(count)
	positions[originIndex] = minPos + originIndex * gap
	scales[originIndex] = 1

	// 기준점이 이미 그 끝이면 그 방향 세그먼트는 없다 — 코너 기준점은 한 방향만 압축된다.
	applySegment(0)
	applySegment(count - 1)

	function applySegment(toIndex: number) {
		const segmentCount = Math.abs(toIndex - originIndex) + 1
		if (segmentCount <= 1) return

		const step = toIndex > originIndex ? 1 : -1
		const fromPos = positions[originIndex]
		const farBoundaryPos = minPos + toIndex * gap
		const idealPositions: number[] = []
		const segmentScales: number[] = []

		for (let k = 0; k < segmentCount; k++) {
			const rawT = k / (segmentCount - 1) // 0=기준점, 1=이 방향의 그리드 경계
			const nearness = 1 - rawT
			// gamma>1이라 기준점 근처는 완만하고 경계 쪽이 압축된다.
			const spatialT = 1 - (1 - rawT) ** depthGamma
			idealPositions.push(lerp(fromPos, farBoundaryPos, spatialT))
			segmentScales.push(lerp(depthScaleMin, 1, nearness ** depthGamma))
		}

		// 이상 위치를 자르는 게 아니라 이상 간격에 하한을 걸고 처음부터 다시 누적한다 —
		// 그래야 압축된 칸에서도 선들이 서로 뭉치지 않는다.
		const direction = farBoundaryPos >= fromPos ? 1 : -1
		const segmentPositions = [idealPositions[0]]
		for (let k = 1; k < segmentCount; k++) {
			const idealGap = Math.abs(idealPositions[k] - idealPositions[k - 1])
			segmentPositions.push(
				segmentPositions[k - 1] + direction * Math.max(minCellGap, idealGap),
			)
		}

		// 하한 때문에 늘어난 간격이 쌓이면 경계 밖으로 튀어나간다. 기준점을 앵커로 두고 비례 축소한다.
		// 🔴 예외 경로가 아니다 — 720×720 기본값·중앙 기준점에서 이미 발동해 최종 간격이 minCellGap 밑으로
		//    내려간다(7.734 < 8). 「minCellGap이 최종 하한」은 불변식이 아니다.
		const actualSpan = Math.abs(segmentPositions[segmentCount - 1] - segmentPositions[0])
		const allowedSpan = Math.abs(farBoundaryPos - fromPos)
		if (actualSpan > allowedSpan && actualSpan > 0) {
			const overshootFix = allowedSpan / actualSpan
			for (let k = 0; k < segmentCount; k++) {
				segmentPositions[k] =
					segmentPositions[0] + (segmentPositions[k] - segmentPositions[0]) * overshootFix
			}
		}

		for (let k = 0; k < segmentCount; k++) {
			const index = originIndex + step * k
			positions[index] = segmentPositions[k]
			scales[index] = segmentScales[k]
		}
	}

	// 보정 이후 실제 이웃 간격. 칸마다 정체가 다르다 — 끝 칸은 한쪽만, 안쪽 칸은 양쪽 평균이다.
	const gaps: number[] = []
	for (let index = 0; index < count; index++) {
		if (count === 1) gaps.push(gap)
		else if (index === 0) gaps.push(Math.abs(positions[1] - positions[0]))
		else if (index === count - 1)
			gaps.push(Math.abs(positions[count - 1] - positions[count - 2]))
		else gaps.push(Math.abs(positions[index + 1] - positions[index - 1]) / 2)
	}

	return { positions, scales, gaps }
}

function getGridPosition(
	metrics: KeyVisualPatternMetrics,
	layout: { row: AxisLayout; column: AxisLayout } | null,
	row: number,
	column: number,
): Point & { depthScale: number; localGap: number | null } {
	if (!layout) {
		return {
			x: metrics.horizontalMargin + column * metrics.columnGap,
			y: metrics.verticalMargin + row * metrics.rowGap,
			depthScale: 1,
			localGap: null,
		}
	}
	return {
		x: layout.column.positions[column],
		y: layout.row.positions[row],
		depthScale: (layout.row.scales[row] + layout.column.scales[column]) / 2,
		localGap: Math.min(layout.row.gaps[row], layout.column.gaps[column]),
	}
}

function getLineAngle(
	input: KeyVisualPatternInput,
	metrics: KeyVisualPatternMetrics,
	position: Point,
	origin: Point,
	row: number,
	column: number,
) {
	if (input.direction === 'vertical') return Math.PI / 2
	if (input.direction === 'horizontal') return 0

	let directionX = origin.x - position.x
	let directionY = origin.y - position.y

	// 기준점이 칸에 스냅되므로 거리가 정확히 0인 칸이 매 렌더에 하나 생기고, 그 칸만 각도를 못 구한다.
	// 🔴 원본(HD_PATTERN.js L719~723)의 설명 주석이 코드와 정반대다("위/아래 끝 줄이면 세로 / 좌우 끝
	//    줄이면 가로"). 화면을 만든 것은 코드이므로 코드를 정본으로 옮겼다 — 끝 행은 가로, 끝 열은 세로다.
	// 네 모서리도 대각선이 아니라 안쪽 칸과 같은 규칙(더 좁은 축 방향)을 쓴다.
	if (directionX === 0 && directionY === 0) {
		const isRowEdge = row === 0 || row === metrics.rows - 1
		const isColumnEdge = column === 0 || column === metrics.columns - 1
		const preferVertical = metrics.columnGap > metrics.rowGap

		if (isRowEdge && isColumnEdge) {
			directionX = preferVertical ? 0 : 1
			directionY = preferVertical ? 1 : 0
		} else if (isColumnEdge) {
			directionX = 0
			directionY = 1
		} else if (isRowEdge) {
			directionX = 1
			directionY = 0
		} else if (preferVertical) {
			directionX = 0
			directionY = 1
		} else {
			directionX = 1
			directionY = 0
		}
	}

	return Math.atan2(directionY, directionX)
}

/**
 * 기준점에서 멀어질수록 얇아진다. 정규화 기준은 원근 위치가 아니라 평면 격자 전체의 대각선이다 —
 * 그래야 기준점을 가장 끝 칸에 올렸을 때 두께가 정확히 최솟값이 된다.
 *
 * 🔴 감쇠가 선형이다. Forward Straight는 smoothstep을 쓰지만 여기서는 원본이 일부러 쓰지 않았다
 *    (중간 지점에서 두께가 유독 빠르게 바뀌어 보인다).
 */
function getLineWeight(
	metrics: KeyVisualPatternMetrics,
	position: Point,
	origin: Point,
	spanX: number,
	spanY: number,
) {
	const distance = Math.hypot(origin.x - position.x, origin.y - position.y)
	const maxFalloffDistance = Math.hypot(spanX, spanY)
	// 🔴 1×1 격자에서는 대각선이 0이다. 0으로 나눈 NaN은 clamp를 그대로 통과해 두께로 새 나간다.
	const progress = maxFalloffDistance > 0 ? clamp(distance / maxFalloffDistance, 0, 1) : 0
	return lerp(metrics.maxLineWeight, metrics.minLineWeight, progress)
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max)
}

function lerp(start: number, end: number, progress: number) {
	return start + (end - start) * progress
}

export function createKeyVisualPatternVectorArtifact(
	scene: KeyVisualPatternScene,
): VectorSceneArtifact {
	return {
		kind: 'vector',
		source: {
			width: scene.width,
			height: scene.height,
			background: scene.backgroundColor,
			primitives: scene.dashes.map((dash) => ({
				kind: 'line' as const,
				x1: dash.x1,
				y1: dash.y1,
				x2: dash.x2,
				y2: dash.y2,
				stroke: scene.lineColor,
				strokeWidth: dash.weight,
				lineCap: 'square' as const,
			})),
		},
	}
}

const model = {
	createVectorArtifact: (values, viewport) =>
		createKeyVisualPatternVectorArtifact(
			createKeyVisualPatternScene(toKeyVisualPatternInput(values), viewport),
		),
	getBindings: (viewport): ControllerRuntimeBindings =>
		viewport.width > 0 && viewport.height > 0
			? { origin: { padAspectRatio: viewport.width / viewport.height } }
			: {},
} satisfies GraphicModelAdapter

export default model
