import {
	FORWARD_STRAIGHT_DEFAULT_INPUT,
	toControllerPadValue,
} from '@/features/generate-graphic/forward-straight'
import {
	type GraphicStudioConfig,
	parseGraphicStudioConfig,
} from '@/features/graphic-studio/graphic-studio-config'

export const forwardStraightGraphicConfig = {
	studio: 'graphic',
	id: 'forward-straight',
	version: 1,
	name: 'Forward Straight',
	type: 'p5',
	output: { formats: ['svg'] },
	controller: {
		groups: [
			{
				id: 'graphic',
				title: 'Graphic',
				collapsible: true,
				controls: [
					{
						id: 'variableWeightEnabled',
						kind: 'toggle',
						label: '가변 두께',
						defaultValue: FORWARD_STRAIGHT_DEFAULT_INPUT.variableWeightEnabled,
					},
					{
						id: 'viewpoint',
						kind: 'select',
						label: '시점',
						defaultValue: FORWARD_STRAIGHT_DEFAULT_INPUT.viewpoint,
						options: [
							{ value: 'flat', label: '평면' },
							{ value: 'low-angle', label: '로우앵글' },
						],
					},
					{
						id: 'angleIntensity',
						kind: 'select',
						label: '각도',
						defaultValue: FORWARD_STRAIGHT_DEFAULT_INPUT.angleIntensity,
						options: [
							{ value: 'weak', label: '약함' },
							{ value: 'medium', label: '보통' },
							{ value: 'strong', label: '강함' },
						],
					},
				],
			},
			{
				id: 'position',
				title: 'Position',
				controls: [
					{
						id: 'origin',
						kind: 'pad',
						label: '기준점',
						defaultValue: toControllerPadValue(FORWARD_STRAIGHT_DEFAULT_INPUT.origin),
					},
				],
			},
		],
	},
} as const satisfies GraphicStudioConfig

parseGraphicStudioConfig(forwardStraightGraphicConfig)
