import { describe, expect, it } from 'vitest'
import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'
import { INFOGRAPHIC_SAMPLE_DATA, parseChartData } from './chart-data'
import manifest from './definition'
import model, {
	createInfographicScene,
	INFOGRAPHIC_CHART_TYPES,
	INFOGRAPHIC_DEFAULT_PALETTE,
	type InfographicChartType,
	toInfographicInput,
} from './model'
import { HD_INFOGRAPHIC_PALETTES, readableTextColor } from './palette'

const VIEWPORT = { width: 1080, height: 1080 }
const chartTypes = INFOGRAPHIC_CHART_TYPES.map(({ id }) => id)

function sceneFor(
	chartType: InfographicChartType,
	overrides: Partial<{ showValueLabels: boolean }> = {},
) {
	return createInfographicScene(
		{
			chartType,
			palette: INFOGRAPHIC_DEFAULT_PALETTE,
			showValueLabels: true,
			data: parseChartData(INFOGRAPHIC_SAMPLE_DATA[chartType]),
			...overrides,
		},
		VIEWPORT,
	)
}

describe('infographic model', () => {
	it('12종 전부 자기 샘플 데이터로 무언가를 그린다', () => {
		expect(chartTypes).toHaveLength(12)
		for (const chartType of chartTypes) {
			const scene = sceneFor(chartType)
			expect(scene.primitives.length, chartType).toBeGreaterThan(0)
			expect(scene.width).toBe(VIEWPORT.width)
		}
	})

	it('데이터가 없으면 빈 판이다 — 입력 중인 상태라 오류가 아니다', () => {
		for (const chartType of chartTypes) {
			const scene = createInfographicScene(
				{
					chartType,
					palette: INFOGRAPHIC_DEFAULT_PALETTE,
					showValueLabels: true,
					data: parseChartData(''),
				},
				VIEWPORT,
			)
			expect(scene.primitives, chartType).toHaveLength(0)
		}
	})

	it('값 표시를 끄면 축 눈금 말고는 글자가 남지 않는다', () => {
		for (const chartType of chartTypes) {
			const texts = sceneFor(chartType, { showValueLabels: false }).primitives.filter(
				(primitive) => primitive.kind === 'text',
			)
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
			expect(model.getRestrictions({ chartType })?.controls[0]).toEqual({
				controlId: 'data',
				defaultValue: INFOGRAPHIC_SAMPLE_DATA[chartType],
			})
		}
	})
})
