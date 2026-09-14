import { defineGraphicRuntime } from '@/features/graphic-generation/graphic-runtimes/define-graphic-runtime'
import { INFOGRAPHIC_CHART_TYPES, INFOGRAPHIC_DEFAULT_INPUT } from './model'
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
		// 표현과 색이 창작자가 실제로 다루는 두 축이다.
		left: ['chartType', 'palette'],
		right: ['showValueLabels'],
		groups: [
			{
				id: 'chart',
				title: 'Chart',
				controls: [
					{
						id: 'chartType',
						kind: 'select' as const,
						label: '표현',
						variant: 'list' as const,
						defaultValue: INFOGRAPHIC_DEFAULT_INPUT.chartType,
						options: INFOGRAPHIC_CHART_TYPES.map(({ id, label }) => ({
							value: id,
							label,
						})),
					},
					{
						id: 'palette',
						kind: 'select' as const,
						label: '팔레트',
						variant: 'list' as const,
						defaultValue: INFOGRAPHIC_DEFAULT_INPUT.palette,
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
				id: 'labels',
				title: 'Labels',
				controls: [
					{
						id: 'showValueLabels',
						kind: 'toggle' as const,
						label: '값 표시',
						defaultValue: INFOGRAPHIC_DEFAULT_INPUT.showValueLabels,
					},
				],
			},
		],
	},
})
