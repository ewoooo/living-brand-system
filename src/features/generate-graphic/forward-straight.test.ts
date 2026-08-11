import { describe, expect, it } from 'vitest'
import {
	forwardStraightGraphicConfig,
	renderGraphicStudioSvg,
} from '@/features/graphic-studio/graphic-studio-runtime'
import { createControllerValues } from '@/features/studio-controller/controller-definition'
import {
	FORWARD_STRAIGHT_DEFAULT_INPUT,
	forwardStraightInputSchema,
	toForwardStraightInput,
} from './forward-straight'

describe('forwardStraightGraphicConfig', () => {
	it('P5 계약의 Controller 기본값을 런타임 입력으로 복원한다', () => {
		expect(forwardStraightGraphicConfig.type).toBe('p5')
		expect(
			toForwardStraightInput(
				createControllerValues(forwardStraightGraphicConfig.controller.groups),
			),
		).toEqual(FORWARD_STRAIGHT_DEFAULT_INPUT)
	})

	it('런타임 입력의 범위와 알려지지 않은 필드를 거부한다', () => {
		expect(
			forwardStraightInputSchema.safeParse({
				...FORWARD_STRAIGHT_DEFAULT_INPUT,
				origin: { x: 1.1, y: 0.5 },
			}).success,
		).toBe(false)
		expect(
			forwardStraightInputSchema.safeParse({
				...FORWARD_STRAIGHT_DEFAULT_INPUT,
				extra: true,
			}).success,
		).toBe(false)
	})

	it('Controller 기본값과 viewport를 pure SVG runtime에 전달한다', () => {
		const values = createControllerValues(forwardStraightGraphicConfig.controller.groups)
		const first = renderGraphicStudioSvg(forwardStraightGraphicConfig, values, {
			width: 100,
			height: 100,
		})
		const second = renderGraphicStudioSvg(forwardStraightGraphicConfig, values, {
			width: 100,
			height: 100,
		})
		expect(second).toBe(first)
		expect(first).toContain('viewBox="0 0 100 100"')
	})
})
