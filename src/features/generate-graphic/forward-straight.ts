import { z } from 'zod'
import {
	type ControllerPadValue,
	type ControllerValues,
	isControllerPadValue,
} from '@/features/studio-controller/controller-definition'

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

export const FORWARD_STRAIGHT_DEFAULT_INPUT = {
	variableWeightEnabled: false,
	viewpoint: 'flat',
	angleIntensity: 'medium',
	origin: { x: 0.5, y: 0.5 },
} satisfies ForwardStraightInput

/** Controller primitive 값(-1~1)을 Forward Straight 입력(0~1)으로 바꾸고 검증한다. */
export function toForwardStraightInput(values: ControllerValues): ForwardStraightInput {
	const origin = values.origin
	return forwardStraightInputSchema.parse({
		variableWeightEnabled: values.variableWeightEnabled,
		viewpoint: values.viewpoint,
		angleIntensity: values.angleIntensity,
		origin: isControllerPadValue(origin)
			? { x: (origin.x + 1) / 2, y: (origin.y + 1) / 2 }
			: origin,
	})
}

export function toControllerPadValue(origin: ForwardStraightInput['origin']): ControllerPadValue {
	return { x: origin.x * 2 - 1, y: origin.y * 2 - 1 }
}
