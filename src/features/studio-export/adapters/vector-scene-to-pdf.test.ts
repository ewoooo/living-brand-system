import { describe, expect, it } from 'vitest'
import { parseColor, roundedRectPath } from './vector-scene-to-pdf.pdf-lib'

describe('parseColor', () => {
	// 🔴 못 읽는 색은 undefined가 되어 그 도형이 색 없이 사라진다 — 인쇄물에서 눈치채기 어렵다.
	//    실제로 로고 SVG가 fill="black"으로 들어와 PDF에서만 비었다(2026-08-27).
	it('씬이 약속한 #rrggbb와 흔한 변형을 읽는다', () => {
		expect(parseColor('#00ad45')).toMatchObject({ red: 0, blue: 69 / 255 })
		expect(parseColor('#fff')).toMatchObject({ red: 1, green: 1, blue: 1 })
		expect(parseColor('rgb(0, 173, 69)')).toMatchObject({ red: 0, blue: 69 / 255 })
	})

	it('읽을 수 없으면 undefined다 — 호출부가 색 없음으로 다룬다', () => {
		expect(parseColor('nonsense')).toBeUndefined()
	})
})

describe('roundedRectPath', () => {
	it('반지름이 변의 절반을 넘으면 잘라 낸다', () => {
		expect(roundedRectPath(10, 10, 999)).toContain('M5 0')
	})
})
