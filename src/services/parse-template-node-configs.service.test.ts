import { describe, expect, it } from 'vitest'
import { parseTemplateNodeConfigs } from './parse-template-node-configs.service'

describe('parseTemplateNodeConfigs imageTransform', () => {
	it('유한수 네 값이 범위 안이면 허용한다', () => {
		const parsed = parseTemplateNodeConfigs({
			'frame-1': { imageTransform: { x: 120, y: -300, scale: 1.5, rotate: -45 } },
		})

		expect('blocker' in parsed).toBe(false)
		if (!('blocker' in parsed)) {
			expect(parsed.data['frame-1']?.imageTransform).toEqual({
				x: 120,
				y: -300,
				scale: 1.5,
				rotate: -45,
			})
		}
	})

	it('imageTransform이 없어도 허용한다', () => {
		const parsed = parseTemplateNodeConfigs({ 'frame-1': { text: 'hi' } })

		expect('blocker' in parsed).toBe(false)
	})

	it.each([
		['숫자가 아닌 값', { x: '1', y: 0, scale: 1, rotate: 0 }],
		['비유한수', { x: Number.NaN, y: 0, scale: 1, rotate: 0 }],
		['scale 0 이하', { x: 0, y: 0, scale: 0, rotate: 0 }],
		['scale 20 초과', { x: 0, y: 0, scale: 21, rotate: 0 }],
		['이동 ±10000 초과', { x: 10001, y: 0, scale: 1, rotate: 0 }],
		['회전 ±360 초과', { x: 0, y: 0, scale: 1, rotate: 361 }],
		['필드 누락', { x: 0, y: 0, scale: 1 }],
		['알 수 없는 필드', { x: 0, y: 0, scale: 1, rotate: 0, skew: 5 }],
	])('%s은 거부한다', (_label, imageTransform) => {
		const parsed = parseTemplateNodeConfigs({ 'frame-1': { imageTransform } })

		expect('blocker' in parsed).toBe(true)
	})
})
