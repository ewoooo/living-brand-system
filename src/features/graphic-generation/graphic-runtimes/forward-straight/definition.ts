import { defineGraphicRuntime } from '@/features/graphic-generation/graphic-runtimes/define-graphic-runtime'
import type { ControllerPadValue } from '@/modules/studio-controller/controller-definition'

export const FORWARD_STRAIGHT_DEFAULT_INPUT: {
	variableWeightEnabled: boolean
	viewpoint: 'flat' | 'low-angle'
	angleIntensity: 'weak' | 'medium' | 'strong'
	origin: { x: number; y: number }
} = {
	variableWeightEnabled: false,
	viewpoint: 'flat',
	angleIntensity: 'medium',
	origin: { x: 0.5, y: 0.5 },
}

export function toControllerPadValue(
	origin: (typeof FORWARD_STRAIGHT_DEFAULT_INPUT)['origin'],
): ControllerPadValue {
	return { x: origin.x * 2 - 1, y: origin.y * 2 - 1 }
}

export default defineGraphicRuntime({
	studio: 'graphic',
	id: 'forward-straight',
	version: 1,
	name: 'Forward Straight',
	type: 'p5',
	artifacts: { vector: {}, raster: {} },
	controller: {
		groups: [
			{
				id: 'graphic',
				title: 'Graphic',
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
})
