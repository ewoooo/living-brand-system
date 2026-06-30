import { describe, expect, it } from 'vitest'
import { checkColorPalette, type Rgb } from './color-check'
import {
	ESSENHERB_PASS_THRESHOLD,
	ESSENHERB_SWATCHES,
	PALETTE_DELTA_E_TOLERANCE,
} from './essenherb-palette'

function fill(rgb: Rgb, count: number): Rgb[] {
	return Array.from({ length: count }, () => rgb)
}

const run = (pixels: Rgb[]) =>
	checkColorPalette(
		pixels,
		ESSENHERB_SWATCHES,
		ESSENHERB_PASS_THRESHOLD,
		PALETTE_DELTA_E_TOLERANCE,
	)

describe('checkColorPalette', () => {
	it('판정한다: 전부 지정 컬러면 충족률 100·통과', () => {
		// Essenherb Red(EA5343) + White + Black
		const pixels = [
			...fill({ r: 0xea, g: 0x53, b: 0x43 }, 50),
			...fill({ r: 0xff, g: 0xff, b: 0xff }, 30),
			...fill({ r: 0x00, g: 0x00, b: 0x00 }, 20),
		]
		const result = run(pixels)
		expect(result.fulfillment).toBe(100)
		expect(result.pass).toBe(true)
		expect(result.offPalette).toHaveLength(0)
	})

	it('판정한다: 규정 외 컬러는 off-palette·미통과', () => {
		// 형광 마젠타는 어떤 essenherb swatch와도 멀다
		const pixels = [
			...fill({ r: 0xea, g: 0x53, b: 0x43 }, 50),
			...fill({ r: 0xff, g: 0x00, b: 0xff }, 50),
		]
		const result = run(pixels)
		expect(result.fulfillment).toBe(50)
		expect(result.pass).toBe(false)
		expect(result.offPalette[0]?.hex).toBe('FF00FF')
	})

	it('빈 입력은 충족률 0', () => {
		expect(run([]).fulfillment).toBe(0)
	})
})
