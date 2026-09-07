import { describe, expect, it } from 'vitest'
import { resolveCmykIccProfilePath } from '../color-profile.server'
import { convertRgbToCmyk } from './rgb-to-cmyk.sharp'

const icc = resolveCmykIccProfilePath('cgats21-crpc6')

describe('convertRgbToCmyk', () => {
	it('순수 검정은 K만으로 나간다', async () => {
		const map = await convertRgbToCmyk(['#000000', '#FFFFFF'], icc)
		// 🔴 ICC를 그대로 쓰면 307.5%(C76.5 M71.8 Y61.6 K97.6)가 되어 글자가 네 판에 찍힌다.
		expect(map.get('#000000')).toEqual({ c: 0, m: 0, y: 0, k: 1 })
		expect(map.get('#ffffff')).toEqual({ c: 0, m: 0, y: 0, k: 0 })
	})

	it('유채색은 ICC를 그대로 탄다', async () => {
		const map = await convertRgbToCmyk(['#003087', '#00ad45'], icc)
		const navy = map.get('#003087')
		expect(navy?.c).toBeGreaterThan(0.9)
		expect(navy?.m).toBeGreaterThan(0.5)
		const green = map.get('#00ad45')
		expect(green?.m).toBeLessThan(0.1)
		expect(green?.y).toBeGreaterThan(0.9)
	})

	it('총 잉크량이 프로파일 상한(300%)을 넘지 않는다', async () => {
		const map = await convertRgbToCmyk(['#000000', '#003087', '#00ad45', '#333333'], icc)
		for (const ink of map.values()) {
			expect(ink.c + ink.m + ink.y + ink.k).toBeLessThanOrEqual(3)
		}
	})
})
