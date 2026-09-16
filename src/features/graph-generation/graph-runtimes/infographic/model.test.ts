import { describe, expect, it } from 'vitest'
import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'
import { INFOGRAPHIC_SAMPLE_DATA, parseChartData } from './chart-data'
import { CHART_SHAPE_LABELS, chartShapeKey } from './chart-shapes'
import manifest from './definition'
import model, {
	createInfographicScene,
	INFOGRAPHIC_CHART_TYPES,
	INFOGRAPHIC_DEFAULT_PALETTE,
	type InfographicChartType,
	type InfographicInput,
	toInfographicInput,
} from './model'
import { HD_INFOGRAPHIC_PALETTES, readableTextColor } from './palette'

const VIEWPORT = { width: 1080, height: 1080 }
const chartTypes = INFOGRAPHIC_CHART_TYPES.map(({ id }) => id)

function sceneFor(chartType: InfographicChartType, overrides: Partial<InfographicInput> = {}) {
	return createInfographicScene(
		{
			chartType,
			palette: INFOGRAPHIC_DEFAULT_PALETTE,
			showNameLabels: true,
			showValueLabels: true,
			textScale: 1,
			uniformValueSize: true,
			data: parseChartData(INFOGRAPHIC_SAMPLE_DATA[chartType]),
			...overrides,
		},
		VIEWPORT,
	)
}

describe('infographic model', () => {
	it('모든 표현이 자기 샘플 데이터로 무언가를 그린다', () => {
		// 정본 12 + 확장 3. 수를 박아 두는 것은 표현이 조용히 늘거나 사라지는 것을 잡기 위해서다.
		expect(chartTypes).toHaveLength(15)
		expect(INFOGRAPHIC_CHART_TYPES.filter((chart) => chart.source === 'canon')).toHaveLength(12)
		for (const chartType of chartTypes) {
			const scene = sceneFor(chartType)
			expect(scene.primitives.length, chartType).toBeGreaterThan(0)
			expect(scene.width).toBe(VIEWPORT.width)
		}
	})

	it('데이터가 없으면 빈 판이다 — 입력 중인 상태라 오류가 아니다', () => {
		for (const chartType of chartTypes) {
			const scene = sceneFor(chartType, { data: parseChartData('') })
			expect(scene.primitives, chartType).toHaveLength(0)
		}
	})

	it('값 표시를 끄면 축 눈금 말고는 글자가 남지 않는다', () => {
		for (const chartType of chartTypes) {
			const texts = sceneFor(chartType, {
				showValueLabels: false,
				showNameLabels: false,
			}).primitives.filter((primitive) => primitive.kind === 'text')
			// 선 차트의 축 눈금은 값 라벨이 아니라 좌표계라 남는다.
			expect(texts.length === 0 || chartType === 'line', chartType).toBe(true)
		}
	})

	it('면 위의 글자는 대비가 갈리는 쪽으로만 정해진다', () => {
		expect(readableTextColor('#DCF5D2')).toBe('#00280A')
		expect(readableTextColor('#00280A')).toBe('#FFFFFF')
		expect(readableTextColor('#000A32')).toBe('#FFFFFF')
		expect(readableTextColor('#00AF41')).toBe('#FFFFFF')
	})

	it('정의된 컨트롤 밖의 값은 기본값으로 떨어진다', () => {
		const input = toInfographicInput({ chartType: '3d-pie', palette: 'rainbow' })
		expect(input.chartType).toBe('pie')
		expect(input.palette).toBe(INFOGRAPHIC_DEFAULT_PALETTE)
	})

	it('컨트롤 선택지가 코드가 그릴 수 있는 것과 같다', () => {
		const controls: ControllerControlDefinition[] = manifest.controller.groups.flatMap(
			(group) => [...group.controls],
		)
		const optionValues = (controlId: string) => {
			const control = controls.find((candidate) => candidate.id === controlId)
			return control?.kind === 'select' ? control.options.map((option) => option.value) : []
		}
		expect(optionValues('chartType')).toEqual(chartTypes)
		expect(optionValues('palette')).toEqual(Object.keys(HD_INFOGRAPHIC_PALETTES))
	})

	it('표현을 고르면 그 표현의 샘플이 데이터 기본값이 된다 — 초기화가 되돌리는 자리다', () => {
		for (const chartType of chartTypes) {
			const data = INFOGRAPHIC_SAMPLE_DATA[chartType]
			const restrictions = model.getRestrictions({ data, chartType })
			expect(restrictions?.controls.find((control) => control.controlId === 'data')).toEqual({
				controlId: 'data',
				defaultValue: data,
			})
		}
	})

	it('표현은 데이터와 무관하게 언제나 전부 선다 — 숨기면 왜 사라졌는지 알 수 없다', () => {
		const controls = manifest.controller.groups.flatMap((group) => [...group.controls])
		const chartControl = controls.find((control) => control.id === 'chartType')
		expect(chartControl?.kind === 'select' && chartControl.options).toHaveLength(
			INFOGRAPHIC_CHART_TYPES.length,
		)
		// 어떤 데이터를 넣어도 선택지를 좁히지 않는다.
		for (const sample of [INFOGRAPHIC_SAMPLE_DATA.pie, INFOGRAPHIC_SAMPLE_DATA.line, '']) {
			const narrowed = model
				.getRestrictions({ data: sample })
				?.controls.find((control) => control.controlId === 'chartType')
			expect(narrowed).toBeUndefined()
		}
	})

	it('같은 성격의 데이터를 받는 표현끼리 한 묶음이다', () => {
		const controls = manifest.controller.groups.flatMap((group) => [...group.controls])
		const chartControl = controls.find((control) => control.id === 'chartType')
		const options = chartControl?.kind === 'select' ? chartControl.options : []
		// 묶음은 이름이 아니라 shape에서 나온다 — 선언한 묶음이 실제 shape와 어긋나면 안 된다.
		for (const option of options) {
			const chart = INFOGRAPHIC_CHART_TYPES.find((candidate) => candidate.id === option.value)
			if (!chart) throw new Error(`표현을 찾을 수 없습니다: ${option.value}`)
			expect(option.group, option.value).toBe(CHART_SHAPE_LABELS[chartShapeKey(chart.shape)])
		}
		// 같은 묶음이 목록에서 흩어지면 화면에 같은 제목이 두 번 선다.
		const groups = options.map((option) => option.group)
		expect(new Set(groups).size).toBe(
			groups.filter((group, index) => index === 0 || group !== groups[index - 1]).length,
		)
	})
})

describe('글자 크기', () => {
	/** 이름으로 그려진 글자만 — 수치(%)와 축 눈금은 제외한다. */
	function nameSizes(chartType: InfographicChartType) {
		// 영역은 행 라벨이 아니라 머리글(계열 이름)을 적는다 — 둘 다 「이름」이다.
		const data = parseChartData(INFOGRAPHIC_SAMPLE_DATA[chartType])
		const labels = [...data.series, ...data.rows.map((row) => row.label)]
		return sceneFor(chartType)
			.primitives.filter(
				(primitive) => primitive.kind === 'text' && labels.includes(primitive.text),
			)
			.map((primitive) => (primitive.kind === 'text' ? primitive.fontSize : 0))
	}

	it('이름은 한 차트 안에서 언제나 같은 크기다', () => {
		for (const chart of INFOGRAPHIC_CHART_TYPES) {
			if (!chart.usesNameLabels) continue
			const sizes = nameSizes(chart.id)
			expect(sizes.length, chart.id).toBeGreaterThan(1)
			expect(new Set(sizes.map((size) => size.toFixed(4))).size, chart.id).toBe(1)
		}
	})

	it('배율이 모든 글자에 곱해진다', () => {
		const at = (scale: number) =>
			sceneFor('bar', { textScale: scale })
				.primitives.filter((primitive) => primitive.kind === 'text')
				.map((primitive) => (primitive.kind === 'text' ? primitive.fontSize : 0))
		const single = at(1)
		const double = at(1.6)
		expect(double.every((size, index) => Math.abs(size - single[index] * 1.6) < 0.01)).toBe(
			true,
		)
	})

	it('이름을 쓰지 않는 표현에서는 이름 표시가 잠긴다', () => {
		const locked = model
			.getRestrictions({ data: INFOGRAPHIC_SAMPLE_DATA.pie, chartType: 'pie' })
			?.controls.find((control) => control.controlId === 'showNameLabels')
		expect(locked?.availability).toBe('disabled')
		const open = model
			.getRestrictions({
				data: INFOGRAPHIC_SAMPLE_DATA['stacked-bar'],
				chartType: 'stacked-bar',
			})
			?.controls.find((control) => control.controlId === 'showNameLabels')
		expect(open).toBeUndefined()
	})
})

describe('수치 크기 맞춤', () => {
	/** 수치(`…%`)로 그려진 글자 크기만. */
	function valueSizes(chartType: InfographicChartType, uniformValueSize: boolean) {
		return sceneFor(chartType, { uniformValueSize, showNameLabels: false })
			.primitives.filter(
				(primitive) => primitive.kind === 'text' && /^-?[\d.]+%$/.test(primitive.text),
			)
			.map((primitive) =>
				primitive.kind === 'text' ? Number(primitive.fontSize.toFixed(4)) : 0,
			)
	}

	it('켜면 한 차트의 수치가 전부 같은 크기다', () => {
		for (const chart of INFOGRAPHIC_CHART_TYPES) {
			// 선 차트의 `%`는 수치가 아니라 축 눈금이라 이 축을 따르지 않는다.
			if (chart.id === 'line') continue
			const sizes = valueSizes(chart.id, true)
			if (sizes.length < 2) continue
			expect(new Set(sizes).size, chart.id).toBe(1)
		}
	})

	it('🔴 끄면 실제로 달라진다 — 값 크기가 고정이면 이 스위치는 아무것도 하지 않는다', () => {
		// 정본 12종 중 수치를 여럿 적는 표현은 전부 칸에 맞춰 갈려야 한다.
		for (const chartType of [
			'pie',
			'donut',
			'bar',
			'stacked-column',
			'nested-square',
		] as const) {
			expect(new Set(valueSizes(chartType, false)).size, chartType).toBeGreaterThan(1)
		}
	})
})

describe('정본 도판과의 대조', () => {
	it('영역의 머릿수치는 카피가 아니라 데이터에서 나온다', () => {
		// 정본 도판의 「+24%」 = 마지막 시점에서 첫 계열이 마지막 계열보다 앞선 폭(100 − 76).
		const headline = sceneFor('area').primitives.find(
			(primitive) => primitive.kind === 'text' && primitive.text.startsWith('+'),
		)
		expect(headline?.kind === 'text' && headline.text).toBe('+24%')
		// 값을 바꾸면 따라 움직인다 — 박아 둔 문자열이 아니다.
		const moved = createInfographicScene(
			{
				chartType: 'area',
				palette: INFOGRAPHIC_DEFAULT_PALETTE,
				showNameLabels: true,
				showValueLabels: true,
				textScale: 1,
				uniformValueSize: true,
				data: parseChartData('\tA\tB\n1\t0\t0\n2\t90\t50'),
			},
			VIEWPORT,
		).primitives.find(
			(primitive) => primitive.kind === 'text' && primitive.text.startsWith('+'),
		)
		expect(moved?.kind === 'text' && moved.text).toBe('+40%')
	})

	it('선 차트의 보조선은 점선이다 — 데이터 선과 층위가 다르다', () => {
		const gridlines = sceneFor('line').primitives.filter(
			(primitive) => primitive.kind === 'line',
		)
		expect(gridlines.length).toBeGreaterThan(0)
		expect(gridlines.every((line) => line.kind === 'line' && line.dash !== undefined)).toBe(
			true,
		)
	})

	it('비례 원 둘은 떨어져 선다 — 붙이면 두 덩어리가 한 도형으로 읽힌다', () => {
		const circles = sceneFor('proportional-circle').primitives.filter(
			(primitive) => primitive.kind === 'circle',
		)
		expect(circles).toHaveLength(2)
		const [big, small] = circles.map((circle) =>
			circle.kind === 'circle' ? circle : { cx: 0, cy: 0, radius: 0 },
		)
		const distance = Math.hypot(big.cx - small.cx, big.cy - small.cy)
		// 정본 도판처럼 사이가 벌어지되, 둘이 한 장면으로 읽힐 만큼만 떨어진다.
		const gap = distance - (big.radius + small.radius)
		expect(gap).toBeGreaterThan(0)
		expect(gap).toBeLessThan(big.radius)
	})
})
