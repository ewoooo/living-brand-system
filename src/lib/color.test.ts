import { describe, expect, it } from 'vitest'
import { getContrastingForeground, hexToRgb, isLightColor, isValidHex } from './color'

describe('hexToRgb', () => {
	it('parses shorthand hex through the color parser', () => {
		expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
		expect(isLightColor('#fff')).toBe(true)
	})

	it('rejects invalid hex instead of returning a misleading color', () => {
		expect(() => hexToRgb('not-a-color')).toThrow('Invalid hex color')
	})

	it('accepts only six-digit hex with an optional hash', () => {
		expect(isValidHex('#112233')).toBe(true)
		expect(isValidHex('112233')).toBe(true)
		expect(isValidHex('#12345')).toBe(false)
		expect(isValidHex('url(https://example.com/pixel)')).toBe(false)
	})

	it('chooses the black or white foreground with greater WCAG contrast', () => {
		expect(getContrastingForeground('#FFFFFF')).toBe('#000000')
		expect(getContrastingForeground('#000000')).toBe('#FFFFFF')
		expect(getContrastingForeground('#777777')).toBe('#000000')
	})
})
