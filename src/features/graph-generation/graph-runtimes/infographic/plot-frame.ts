import type { VectorPrimitive } from '@/modules/studio-artifact/studio-artifact'
import { type Box, label, niceStep, sharedFontSize, textEms } from './chart-primitives'
import { HD_INFOGRAPHIC_COLORS } from './palette'

/**
 * **판.** 정보량이 많은 표현은 도형만으로 서지 못한다 — 값을 읽을 눈금, 항목을 읽을 이름,
 * 계열을 읽을 범례가 함께 있어야 한다. 그 셋과 그것들이 먹는 여백을 한 자리에서 정한다.
 *
 * 🔑 **이것이 단순 표현과 복합 표현을 가르는 것이다.** 도형 몇 개짜리 표현은 판이 필요 없지만,
 *    복합 표현은 전부 필요하다. 표현마다 각자 축을 그리면 서로 어긋나고, 어긋나는 순간
 *    「통일성」이 사라진다.
 * 🔴 `chart-axes.ts`와 헷갈리지 말 것. 그 파일은 창작자가 만지는 **컨트롤 축**(두께·간격·곡률·
 *    회전, 0~1)이고 판의 축과 아무 관계가 없다.
 */

/** 한 변이 무엇을 말하나. `null`이면 그 변에 아무것도 서지 않고 여백도 먹지 않는다. */
export type PlotAxis =
	| {
			kind: 'value'
			min: number
			max: number
			/** 눈금 글자. 기본은 정본 도판대로 백분율이다. */
			format?: (value: number) => string
	  }
	| {
			kind: 'category'
			labels: readonly string[]
			/**
			 * `band` — 이름이 **칸**을 가리킨다(막대·히트맵). 좌표는 칸의 한가운데다.
			 * `point` — 이름이 **점**을 가리킨다(선·영역). 처음과 끝이 판의 양 끝에 붙는다.
			 */
			scale?: 'band' | 'point'
	  }
	| null

export type PlotFrame = {
	/** 마크가 그려지는 자리. 눈금·이름·범례는 이 밖에 선다. */
	plot: Box
	/** 아래 축의 index → x. 축이 없으면 판을 등분한다. */
	x: (index: number) => number
	/** 왼쪽 축이 value면 값을, category면 index를 받는다. */
	y: (at: number) => number
	/** 아래 축이 `band`일 때 한 칸의 폭. `point`거나 축이 없으면 판 전체 폭이다. */
	bandWidth: number
	/** 왼쪽 축이 `band`일 때 한 칸의 높이. */
	bandHeight: number
	/** 눈금·보조선·이름·범례. 마크보다 **먼저** 그려야 마크가 위에 얹힌다. */
	primitives: VectorPrimitive[]
}

const DEFAULT_FORMAT = (value: number) => `${Math.round(value * 10) / 10}%`

/** 값 축이 실제로 찍는 눈금. 판을 4~6칸으로 끊는다 — 정본 도판의 -4/0/4/8/12와 같은 감각이다. */
function ticksOf(min: number, max: number): { low: number; high: number; step: number } {
	const step = niceStep((max - min) / 4)
	const low = Math.floor(min / step) * step
	return { low, high: Math.max(Math.ceil(max / step) * step, low + step), step }
}

function tickValues({ low, high, step }: { low: number; high: number; step: number }): number[] {
	const values: number[] = []
	for (let tick = low; tick <= high + step / 2; tick += step) values.push(tick)
	return values
}

export function plotFrame(
	box: Box,
	spec: {
		left: PlotAxis
		bottom: PlotAxis
		legend?: { names: readonly string[]; colors: readonly string[] }
		/** 축 글자 크기. 🔑 마크에 적히는 수치와 **다른 크기를 쓰지 않는다** — 한 판에 둘뿐이다. */
		fontSize: number
	},
): PlotFrame {
	const { left, bottom, fontSize } = spec
	const gap = fontSize * 0.6
	const ticks = left?.kind === 'value' ? ticksOf(left.min, left.max) : null
	const format = left?.kind === 'value' ? (left.format ?? DEFAULT_FORMAT) : DEFAULT_FORMAT

	// 왼쪽 여백은 거기 설 글자 중 가장 넓은 것이 정한다. 실측이 안 되므로 어림하고(`textEms`)
	// 넉넉히 잡는다 — 모자라면 글자가 판 밖으로 나가 잘린다.
	const leftTexts =
		ticks !== null
			? tickValues(ticks).map(format)
			: left?.kind === 'category'
				? [...left.labels]
				: []
	const tickWidth =
		leftTexts.length === 0
			? 0
			: Math.max(...leftTexts.map((text) => textEms(text))) * fontSize + gap

	/**
	 * 🔴 `point` 축은 처음과 끝 이름이 판의 **양 끝에 걸터앉는다** — 그 절반이 판 밖으로 나간다.
	 *    양옆에 그만큼을 비워 두지 않으면 첫 이름은 눈금 글자와 겹치고 마지막 이름은 판을 넘는다.
	 */
	const endLabels =
		bottom?.kind === 'category' && bottom.scale === 'point' && bottom.labels.length > 1
			? [bottom.labels[0], bottom.labels[bottom.labels.length - 1]]
			: ['', '']
	const [headRoom, tailRoom] = endLabels.map((text) => (textEms(text) * fontSize) / 2)

	const leftInset = Math.max(tickWidth, headRoom)
	const rightInset = tailRoom
	const bottomInset = bottom === null ? 0 : fontSize + gap

	// 범례는 판 위에 한 줄로 선다. 줄을 넘기지 않고 글자를 줄여 맞춘다 — 두 줄이 되면
	// 판이 얼마나 줄어들지 표현이 알 수 없게 된다.
	const legendNames = spec.legend?.names.filter((name) => name !== '') ?? []
	const legendHeight = legendNames.length > 1 ? fontSize + gap : 0

	const plot: Box = {
		x: box.x + leftInset,
		y: box.y + legendHeight,
		width: Math.max(1, box.width - leftInset - rightInset),
		height: Math.max(1, box.height - legendHeight - bottomInset),
	}

	const columns = bottom?.kind === 'category' ? Math.max(1, bottom.labels.length) : 1
	const bandWidth =
		bottom?.kind === 'category' && bottom.scale !== 'point' ? plot.width / columns : plot.width
	const rows = left?.kind === 'category' ? Math.max(1, left.labels.length) : 1
	const bandHeight = left?.kind === 'category' ? plot.height / rows : plot.height

	const x = (index: number) =>
		bottom?.kind === 'category' && bottom.scale === 'point'
			? plot.x + (columns > 1 ? (index / (columns - 1)) * plot.width : plot.width / 2)
			: plot.x + (index + 0.5) * bandWidth
	const y = (at: number) =>
		ticks !== null
			? plot.y + plot.height - ((at - ticks.low) / (ticks.high - ticks.low)) * plot.height
			: plot.y + (at + 0.5) * bandHeight

	const primitives: VectorPrimitive[] = []

	if (ticks !== null) {
		for (const tick of tickValues(ticks)) {
			primitives.push({
				kind: 'line',
				x1: plot.x,
				y1: y(tick),
				x2: plot.x + plot.width,
				y2: y(tick),
				// 보조선은 데이터가 아니라 좌표계다 — 점선이 그 층위를 말한다. 색만 연하게 하면
				// 흰 판에서 사라지고(오남용 ①), 실선이면 데이터 선과 같은 층위로 읽힌다.
				stroke: HD_INFOGRAPHIC_COLORS.ecoGreen,
				strokeWidth: Math.max(1, fontSize * 0.04),
				dash: [fontSize * 0.18, fontSize * 0.28],
			})
			primitives.push(
				label(
					format(tick),
					plot.x - gap * 0.6,
					y(tick),
					fontSize,
					HD_INFOGRAPHIC_COLORS.deepGreen,
					'end',
				),
			)
		}
	} else if (left?.kind === 'category') {
		left.labels.forEach((text, index) => {
			if (!text) return
			primitives.push(
				label(
					text,
					plot.x - gap,
					y(index),
					fontSize,
					HD_INFOGRAPHIC_COLORS.deepGreen,
					'end',
				),
			)
		})
	}

	if (bottom?.kind === 'category') {
		bottom.labels.forEach((text, index) => {
			if (!text) return
			primitives.push(
				label(
					text,
					x(index),
					plot.y + plot.height + bottomInset / 2,
					fontSize,
					HD_INFOGRAPHIC_COLORS.deepGreen,
				),
			)
		})
	}

	if (legendHeight > 0 && spec.legend) {
		primitives.push(...legendRow(plot, legendNames, spec.legend.colors, fontSize, gap))
	}

	return { plot, x, y, bandWidth, bandHeight, primitives }
}

/**
 * 범례 — 색 칩 + 계열 이름을 한 줄로. 🔴 계열이 하나면 그리지 않는다: 견줄 것이 없는데
 * 이름만 서면 그것이 제목처럼 읽힌다.
 */
function legendRow(
	plot: Box,
	names: readonly string[],
	colors: readonly string[],
	fontSize: number,
	gap: number,
): VectorPrimitive[] {
	const chip = fontSize * 0.8
	// 칩·글자·항목 사이가 먹는 폭을 뺀 나머지를 이름들이 나눠 쓴다.
	const spare = plot.width - names.length * (chip + gap * 0.5) - (names.length - 1) * gap
	const size = sharedFontSize(
		names.map((text) => ({
			text,
			width: Math.max(fontSize, (spare * textEms(text)) / totalEms(names)),
		})),
		fontSize,
	)
	const widths = names.map((text) => chip + gap * 0.5 + textEms(text) * size)
	const total = widths.reduce((sum, width) => sum + width, 0) + (names.length - 1) * gap
	let cursor = plot.x + Math.max(0, (plot.width - total) / 2)
	const center = plot.y - gap - chip / 2
	return names.flatMap((text, index) => {
		const swatch: VectorPrimitive = {
			kind: 'rect',
			x: cursor,
			y: center - chip / 2,
			width: chip,
			height: chip,
			fill: colors[index] ?? HD_INFOGRAPHIC_COLORS.deepGreen,
		}
		const name = label(
			text,
			cursor + chip + gap * 0.5,
			center,
			size,
			HD_INFOGRAPHIC_COLORS.deepGreen,
			'start',
		)
		cursor += widths[index] + gap
		return [swatch, name]
	})
}

function totalEms(names: readonly string[]): number {
	return Math.max(
		1,
		names.reduce((sum, text) => sum + textEms(text), 0),
	)
}
