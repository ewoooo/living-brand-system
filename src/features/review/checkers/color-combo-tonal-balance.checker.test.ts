import { describe, expect, it } from 'vitest'
import type { Rgb } from '@/features/review/color-check'
import { colorComboTonalBalanceChecker } from './color-combo-tonal-balance.checker'

function fill(rgb: Rgb, count: number): Rgb[] {
	return Array.from({ length: count }, () => rgb)
}

const run = (pixels: Rgb[]) => colorComboTonalBalanceChecker.check({ pixels })

describe('color.combo-tonal-balance', () => {
	it('통과한다: 밝은 색 + 어두운 색은 명도차가 커서 균형', () => {
		const pixels = [
			...fill({ r: 0xff, g: 0xff, b: 0xff }, 50), // 흰색 (밝음)
			...fill({ r: 0x00, g: 0x00, b: 0x00 }, 50), // 검정 (어두움)
		]
		const result = run(pixels)
		expect(result.status).toBe('pass')
		expect(result.fulfillment).toBe(100)
	})

	it('미통과한다: 둘 다 어두운 톤(both-dark) 조합', () => {
		const pixels = [
			...fill({ r: 0x00, g: 0x00, b: 0x00 }, 50), // 검정
			...fill({ r: 0x30, g: 0x30, b: 0x30 }, 50), // 어두운 회색
		]
		const result = run(pixels)
		expect(result.status).toBe('fail')
		expect(result.detail).toContain('어두운끼리')
	})

	it('통과한다: 지배색이 1개면 조합 판정 대상 아님', () => {
		const result = run(fill({ r: 0xea, g: 0x53, b: 0x43 }, 100))
		expect(result.status).toBe('pass')
		expect(result.fulfillment).toBe(100)
	})

	it('빈 입력은 미통과·충족률 0', () => {
		const result = run([])
		expect(result.status).toBe('fail')
		expect(result.fulfillment).toBe(0)
	})
})
