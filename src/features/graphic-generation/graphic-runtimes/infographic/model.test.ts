import { describe, expect, it } from 'vitest'
import type { ControllerControlDefinition } from '@/modules/studio-controller/controller-definition'
import manifest from './definition'
import {
	createInfographicScene,
	INFOGRAPHIC_CHART_TYPES,
	INFOGRAPHIC_DEFAULT_INPUT,
	type InfographicChartType,
	toInfographicInput,
} from './model'
import { HD_INFOGRAPHIC_PALETTES, readableTextColor } from './palette'

const VIEWPORT = { width: 1080, height: 1080 }

const chartTypes = INFOGRAPHIC_CHART_TYPES.map(({ id }) => id)

function sceneFor(chartType: InfographicChartType) {
	return createInfographicScene({ ...INFOGRAPHIC_DEFAULT_INPUT, chartType }, VIEWPORT)
}

describe('infographic model', () => {
	it('12종 전부 판 안에서 무언가를 그린다', () => {
		expect(chartTypes).toHaveLength(12)
		for (const chartType of chartTypes) {
			const scene = sceneFor(chartType)
			expect(scene.primitives.length, chartType).toBeGreaterThan(0)
			expect(scene.width).toBe(VIEWPORT.width)
		}
	})

	it('값 표시를 끄면 글자가 하나도 남지 않는다', () => {
		for (const chartType of chartTypes) {
			const scene = createInfographicScene(
				{ ...INFOGRAPHIC_DEFAULT_INPUT, chartType, showValueLabels: false },
				VIEWPORT,
			)
			expect(
				scene.primitives.filter((primitive) => primitive.kind === 'text'),
				chartType,
				// 선 차트의 축 눈금은 값 라벨이 아니라 좌표계라 남는다(y 5단 + x 4틱).
			).toHaveLength(chartType === 'line' ? 9 : 0)
		}
	})

	it('면 위의 글자는 대비가 갈리는 쪽으로만 정해진다', () => {
		expect(readableTextColor('#DCF5D2')).toBe('#00280A')
		expect(readableTextColor('#00280A')).toBe('#FFFFFF')
		expect(readableTextColor('#000A32')).toBe('#FFFFFF')
		expect(readableTextColor('#00AF41')).toBe('#FFFFFF')
	})

	it('정의된 컨트롤 밖의 값은 기본값으로 떨어진다', () => {
		expect(toInfographicInput({ chartType: '3d-pie', palette: 'rainbow' })).toEqual(
			INFOGRAPHIC_DEFAULT_INPUT,
		)
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
})
