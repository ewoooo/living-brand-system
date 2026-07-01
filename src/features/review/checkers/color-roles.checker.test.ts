import { describe, expect, it } from 'vitest'
import type { Rgb } from '@/features/review/color-check'
import { colorRolesChecker } from './color-roles.checker'

function fill(rgb: Rgb, count: number): Rgb[] {
	return Array.from({ length: count }, () => rgb)
}

const run = (pixels: Rgb[]) => colorRolesChecker.check({ pixels })

describe('color.roles', () => {
	it('통과한다: 메인(Essenherb Red) + 보조(White)로 구성', () => {
		const pixels = [
			...fill({ r: 0xea, g: 0x53, b: 0x43 }, 40), // 메인
			...fill({ r: 0xff, g: 0xff, b: 0xff }, 60), // 보조
		]
		const result = run(pixels)
		expect(result.status).toBe('pass')
		expect(result.detail).toContain('메인')
	})

	it('미통과한다: 메인 컬러 없이 멀티 컬러만(Blue+Green)', () => {
		const pixels = [
			...fill({ r: 0x1e, g: 0x50, b: 0x8c }, 50), // Blue 4
			...fill({ r: 0x19, g: 0x5f, b: 0x30 }, 50), // Green 4
		]
		const result = run(pixels)
		expect(result.status).toBe('fail')
		expect(result.detail).toContain('메인 컬러')
	})

	it('미통과한다: 팔레트 밖 색이 지배', () => {
		const pixels = [
			...fill({ r: 0xea, g: 0x53, b: 0x43 }, 10), // 메인 소량
			...fill({ r: 0xff, g: 0x00, b: 0xff }, 90), // 형광 마젠타 (off-palette)
		]
		const result = run(pixels)
		expect(result.status).toBe('fail')
	})

	it('빈 입력은 미통과·충족률 0', () => {
		const result = run([])
		expect(result.status).toBe('fail')
		expect(result.fulfillment).toBe(0)
	})
})
