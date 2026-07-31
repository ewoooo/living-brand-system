import { z } from 'zod'
import type { GraphicToolContract } from './graphic-tool'

export const forwardStraightInputSchema = z.strictObject({
	variableWeightEnabled: z.boolean(),
	viewpoint: z.enum(['flat', 'low-angle']),
	angleIntensity: z.enum(['weak', 'medium', 'strong']),
	origin: z.strictObject({
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
	}),
})

export type ForwardStraightInput = z.infer<typeof forwardStraightInputSchema>

export const forwardStraightToolContract = {
	implementationKey: 'forward-straight-v1',
	inputSchema: forwardStraightInputSchema,
	defaultInput: {
		variableWeightEnabled: false,
		viewpoint: 'flat',
		angleIntensity: 'medium',
		origin: { x: 0.5, y: 0.5 },
	},
	controls: [
		{
			key: 'variableWeightEnabled',
			type: 'boolean',
			label: '가변 두께',
		},
		{
			key: 'viewpoint',
			type: 'select',
			label: '시점',
			options: [
				{ value: 'flat', label: '평면' },
				{ value: 'low-angle', label: '로우앵글' },
			],
		},
		{
			key: 'angleIntensity',
			type: 'select',
			label: '각도',
			options: [
				{ value: 'weak', label: '약함' },
				{ value: 'medium', label: '보통' },
				{ value: 'strong', label: '강함' },
			],
		},
	],
	outputFormats: [{ format: 'svg', mimeType: 'image/svg+xml' }],
} satisfies GraphicToolContract<ForwardStraightInput>
