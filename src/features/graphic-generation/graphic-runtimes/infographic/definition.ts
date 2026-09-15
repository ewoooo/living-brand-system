import { defineGraphicRuntime } from '@/features/graphic-generation/graphic-runtimes/define-graphic-runtime'
import { INFOGRAPHIC_SAMPLE_DATA } from './chart-data'
import { INFOGRAPHIC_CHART_PREVIEWS } from './chart-previews'
import {
	INFOGRAPHIC_CHART_TYPES,
	INFOGRAPHIC_DEFAULT_CHART_TYPE,
	INFOGRAPHIC_DEFAULT_PALETTE,
	INFOGRAPHIC_DEFAULT_SHOW_VALUE_LABELS,
} from './model'
import { HD_INFOGRAPHIC_PALETTES } from './palette'

/**
 * 가이드라인 B.11 INFOGRAPHIC의 12칸을 한 runtime이 갖는다.
 *
 * 🔑 12개 runtime으로 쪼개지 않은 이유: 데이터가 값 축이 아니라 입력이라, 표현마다 달라지는 축이
 *    사실상 없다. 쪼개면 카탈로그·enum·프로파일 행만 12배가 되고 창작자 화면은 같다.
 *
 * 🔴 오남용 6종(3D·아이콘 겹침·이미지 겹침·타 서체·저대비 색·과밀)은 검사기로 막지 않는다 —
 *    그 축을 **아예 만들지 않았다.** 규정을 값 검사가 아니라 선택지의 부재로 표현한다.
 */
export default defineGraphicRuntime({
	studio: 'graphic',
	id: 'infographic',
	version: 1,
	name: 'Infographic',
	type: 'p5',
	artifacts: { vector: {}, raster: {} },
	controller: {
		// 보이는 것을 정하는 축은 전부 왼쪽, 데이터는 오른쪽이다.
		left: ['chartType', 'palette', 'showValueLabels'],
		right: ['data'],
		groups: [
			{
				id: 'chart',
				title: 'Chart',
				controls: [
					{
						id: 'chartType',
						kind: 'select' as const,
						label: '표현',
						defaultValue: INFOGRAPHIC_DEFAULT_CHART_TYPE,
						// 고르는 정보가 이름이 아니라 모양이라 목록이 아니라 썸네일 그리드로 선다.
						options: INFOGRAPHIC_CHART_TYPES.map(({ id, label }) => ({
							value: id,
							label,
							preview: INFOGRAPHIC_CHART_PREVIEWS[id],
						})),
					},
					{
						id: 'palette',
						kind: 'select' as const,
						label: '팔레트',
						variant: 'list' as const,
						defaultValue: INFOGRAPHIC_DEFAULT_PALETTE,
						options: Object.entries(HD_INFOGRAPHIC_PALETTES).map(
							([value, palette]) => ({
								value,
								label: palette.label,
								colors: [...palette.colors],
							}),
						),
					},
				],
			},
			{
				id: 'data',
				title: 'Data',
				controls: [
					{
						id: 'data',
						kind: 'text' as const,
						label: '데이터',
						multiline: true,
						// 격자로도 고치고 붙여넣기로도 고친다 — 같은 값의 두 표현이다.
						grid: ['라벨', '값'],
						// 붙여넣기용이라 통째로 보일 만큼만. 줄 단위 편집은 격자가 갖는다.
						rows: 4,
						resettable: true,
						// 표현을 고르면 그 표현의 이상적인 데이터로 바뀐다(model의 getRestrictions).
						defaultValue: INFOGRAPHIC_SAMPLE_DATA[INFOGRAPHIC_DEFAULT_CHART_TYPE],
						placeholder: '라벨\t값',
					},
				],
			},
			{
				id: 'labels',
				title: 'Labels',
				controls: [
					{
						id: 'showValueLabels',
						kind: 'toggle' as const,
						label: '값 표시',
						defaultValue: INFOGRAPHIC_DEFAULT_SHOW_VALUE_LABELS,
					},
				],
			},
		],
	},
})
