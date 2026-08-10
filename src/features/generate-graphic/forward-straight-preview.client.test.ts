import { describe, expect, it } from 'vitest'
import { isOriginHandleHit } from './forward-straight-preview.client'

describe('isOriginHandleHit', () => {
	it('레드 닷 주변에서만 드래그를 시작한다', () => {
		const origin = { x: 100, y: 100 }

		expect(isOriginHandleHit({ x: 112, y: 100 }, origin, 2.5)).toBe(true)
		expect(isOriginHandleHit({ x: 113, y: 100 }, origin, 2.5)).toBe(false)
	})
})
