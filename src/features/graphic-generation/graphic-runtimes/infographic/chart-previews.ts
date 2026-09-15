import type {
	ControllerOption,
	ControllerPreviewCircle,
	ControllerPreviewLine,
} from '@/modules/studio-controller/controller-definition'
import type { InfographicChartType } from './model'

type Line = ControllerPreviewLine
type Glyph = NonNullable<ControllerOption['preview']>

/**
 * 표현을 고르는 썸네일의 선화. 단위 정사각형(0~1) 안의 선분만 쓴다 — 계약이 좌표만 받는
 * 근거는 `ControllerOption.preview`가 갖는다.
 *
 * 🔑 실제 차트의 축소판이 아니라 **윤곽만** 그린다. 칩은 20px 남짓이라 면을 칠하면 열두 개가
 *    서로 구별되지 않고, 고르는 정보는 색이 아니라 모양이다.
 */

function circle(cx: number, cy: number, r: number): ControllerPreviewCircle[] {
	return [[cx, cy, r]]
}

function rect(x: number, y: number, width: number, height: number): Line[] {
	return [
		[x, y, x + width, y],
		[x + width, y, x + width, y + height],
		[x + width, y + height, x, y + height],
		[x, y + height, x, y],
	]
}

function polyline(points: readonly (readonly [number, number])[]): Line[] {
	return points.slice(1).map((point, index) => {
		const previous = points[index]
		return [previous[0], previous[1], point[0], point[1]] as Line
	})
}

/** 중심에서 테두리로 뻗는 칸막이. 파이·도넛이 조각을 가진다는 것만 보여 준다. */
function spokes(cx: number, cy: number, inner: number, outer: number, turns: readonly number[]) {
	return turns.map((turn) => {
		const angle = turn * Math.PI * 2 - Math.PI / 2
		return [
			cx + Math.cos(angle) * inner,
			cy + Math.sin(angle) * inner,
			cx + Math.cos(angle) * outer,
			cy + Math.sin(angle) * outer,
		] as Line
	})
}

const BAR_SLOTS = [0.1, 0.33, 0.56, 0.79] as const
const BAR_HEIGHTS = [0.3, 0.5, 0.78, 0.6] as const

export const INFOGRAPHIC_CHART_PREVIEWS: Record<InfographicChartType, Glyph> = {
	pie: [...circle(0.5, 0.5, 0.38), ...spokes(0.5, 0.5, 0, 0.38, [0, 0.34, 0.67])],
	donut: [
		...circle(0.5, 0.5, 0.38),
		...circle(0.5, 0.5, 0.19),
		...spokes(0.5, 0.5, 0.19, 0.38, [0, 0.34, 0.67]),
	],
	'proportional-circle': [...circle(0.6, 0.38, 0.28), ...circle(0.26, 0.72, 0.18)],
	'bubble-cluster': [
		...circle(0.56, 0.34, 0.24),
		...circle(0.28, 0.66, 0.15),
		...circle(0.62, 0.74, 0.17),
		...circle(0.86, 0.5, 0.1),
	],
	bar: BAR_SLOTS.flatMap((x, index) =>
		rect(x, 1 - 0.08 - BAR_HEIGHTS[index], 0.13, BAR_HEIGHTS[index]),
	),
	'bar-track': BAR_SLOTS.flatMap((x, index) => [
		...rect(x, 0.1, 0.13, 0.8),
		// 트랙 안을 어디까지 채웠는지가 이 표현의 정보다. 채움선 하나로 보인다.
		[x, 0.9 - BAR_HEIGHTS[index] * 0.8, x + 0.13, 0.9 - BAR_HEIGHTS[index] * 0.8] as Line,
	]),
	'stacked-column': [
		...rect(0.3, 0.1, 0.4, 0.8),
		[0.3, 0.32, 0.7, 0.32],
		[0.3, 0.52, 0.7, 0.52],
		[0.3, 0.76, 0.7, 0.76],
	],
	'stacked-bar': [
		...rect(0.08, 0.36, 0.84, 0.28),
		[0.3, 0.36, 0.3, 0.64],
		[0.62, 0.36, 0.62, 0.64],
	],
	line: [
		[0.12, 0.12, 0.12, 0.86],
		[0.12, 0.86, 0.92, 0.86],
		...polyline([
			[0.12, 0.6],
			[0.35, 0.3],
			[0.58, 0.52],
			[0.88, 0.2],
		]),
		...polyline([
			[0.12, 0.76],
			[0.35, 0.58],
			[0.58, 0.72],
			[0.88, 0.48],
		]),
	],
	area: [
		[0.12, 0.12, 0.12, 0.86],
		[0.12, 0.86, 0.92, 0.86],
		...polyline([
			[0.12, 0.8],
			[0.34, 0.6],
			[0.58, 0.34],
			[0.9, 0.24],
			[0.9, 0.86],
		]),
		[0.3, 0.86, 0.3, 0.63] as Line,
		[0.48, 0.86, 0.48, 0.45] as Line,
		[0.68, 0.86, 0.68, 0.3] as Line,
	],
	// 바닥을 맞춘 겹침 — 세 원의 아래 가장자리가 한 선에 놓인다.
	'nested-circle': [
		...circle(0.5, 0.52, 0.36),
		...circle(0.5, 0.66, 0.22),
		...circle(0.5, 0.78, 0.1),
	],
	'nested-square': [
		...rect(0.34, 0.12, 0.46, 0.46),
		...rect(0.1, 0.44, 0.38, 0.38),
		...rect(0.56, 0.62, 0.28, 0.28),
	],
}
