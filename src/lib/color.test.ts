import { describe, expect, it } from 'vitest'
import { hexToRgb, isLightColor } from './color'

describe('hexToRgb', () => {
	it('parses shorthand hex through the color parser', () => {
		expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
		expect(isLightColor('#fff')).toBe(true)
	})

	it('rejects invalid hex instead of returning a misleading color', () => {
		expect(() => hexToRgb('not-a-color')).toThrow('Invalid hex color')
	})
})
