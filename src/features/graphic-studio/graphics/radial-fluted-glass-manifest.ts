import { RADIAL_FLUTED_GLASS_DEFAULT_INPUT } from '@/features/generate-graphic/radial-fluted-glass'
import {
	type GraphicStudioConfig,
	parseGraphicStudioConfig,
} from '@/features/graphic-studio/graphic-studio-config'

export const radialFlutedGlassGraphicConfig = {
	studio: 'graphic',
	id: 'radial-fluted-glass',
	version: 1,
	name: 'Radial Fluted Glass',
	type: 'shader',
	output: {
		formats: ['mp4'],
		video: {
			mp4: {
				codec: 'h264',
				colorSpace: 'rec709',
				fps: [24, 30, 60],
				maxWidth: 1920,
				maxHeight: 1080,
				maxDurationSeconds: 10,
			},
		},
	},
	controller: {
		groups: [
			{
				id: 'rays',
				title: 'Rays',
				controls: [
					{
						id: 'bloomColor',
						kind: 'color',
						label: '블룸 색상',
						defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.bloomColor,
					},
					{
						id: 'rayIntensity',
						kind: 'range',
						label: '광선 강도',
						defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayIntensity,
						min: 0,
						max: 1,
						step: 0.01,
						display: { precision: 2 },
					},
					{
						id: 'rayDensity',
						kind: 'range',
						label: '광선 밀도',
						defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.rayDensity,
						min: 0,
						max: 1,
						step: 0.01,
						display: { precision: 2 },
					},
					{
						id: 'speed',
						kind: 'range',
						label: '속도',
						defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.speed,
						min: 0,
						max: 2,
						step: 0.01,
						display: { precision: 2 },
					},
				],
			},
			{
				id: 'glass',
				title: 'Glass',
				controls: [
					{
						id: 'glassSize',
						kind: 'range',
						label: '플루트 크기',
						defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.glassSize,
						min: 0,
						max: 1,
						step: 0.01,
						display: { precision: 2 },
					},
					{
						id: 'glassDistortion',
						kind: 'range',
						label: '유리 왜곡',
						defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.glassDistortion,
						min: 0,
						max: 1,
						step: 0.01,
						display: { precision: 2 },
					},
				],
			},
			{
				id: 'position',
				title: 'Position',
				controls: [
					{
						id: 'source',
						kind: 'pad',
						label: '광원',
						defaultValue: RADIAL_FLUTED_GLASS_DEFAULT_INPUT.source,
					},
				],
			},
		],
	},
} as const satisfies GraphicStudioConfig

parseGraphicStudioConfig(radialFlutedGlassGraphicConfig)
