import { describe, expect, it } from 'vitest'
import {
	clampTransform,
	IDENTITY_TRANSFORM,
	isIdentityTransform,
	normalizeAngle,
	panTransform,
	rotateTransform,
	scaleTransform,
} from './image-transform-gestures'

describe('clampTransform', () => {
	it('슬라이더 범위(x/y ±1000, scale 0.2–5, rotate ±180)로 clamp한다', () => {
		expect(clampTransform({ x: 5000, y: -5000, scale: 9, rotate: 400 })).toEqual({
			x: 1000,
			y: -1000,
			scale: 5,
			rotate: 180,
		})
		expect(clampTransform({ x: 0, y: 0, scale: 0.01, rotate: -400 })).toEqual({
			x: 0,
			y: 0,
			scale: 0.2,
			rotate: -180,
		})
	})

	it('표시용 반올림 — x·y·rotate는 0.1, scale은 0.01 단위', () => {
		expect(clampTransform({ x: 12.3456, y: -7.8912, scale: 1.23456, rotate: 44.4444 })).toEqual(
			{ x: 12.3, y: -7.9, scale: 1.23, rotate: 44.4 },
		)
	})
})

describe('panTransform', () => {
	it('템플릿 px 델타를 x/y에 그대로 더하고 scale·rotate는 유지한다', () => {
		expect(panTransform({ x: 10, y: -5, scale: 1.5, rotate: 30 }, 20, 40)).toEqual({
			x: 30,
			y: 35,
			scale: 1.5,
			rotate: 30,
		})
	})

	it('범위를 벗어나면 clamp한다', () => {
		expect(panTransform({ ...IDENTITY_TRANSFORM, x: 990 }, 50, -1200).x).toBe(1000)
		expect(panTransform({ ...IDENTITY_TRANSFORM, x: 990 }, 50, -1200).y).toBe(-1000)
	})
})

describe('scaleTransform', () => {
	const center = { x: 0, y: 0 }

	it('중심 거리 비율만큼 scale을 곱한다', () => {
		const next = scaleTransform(
			{ x: 3, y: 4, scale: 1.2, rotate: 10 },
			center,
			{ x: 10, y: 0 },
			{ x: 20, y: 0 },
		)
		expect(next).toEqual({ x: 3, y: 4, scale: 2.4, rotate: 10 })
	})

	it('0.2–5로 clamp한다', () => {
		expect(
			scaleTransform(IDENTITY_TRANSFORM, center, { x: 1, y: 0 }, { x: 100, y: 0 }).scale,
		).toBe(5)
		expect(
			scaleTransform(IDENTITY_TRANSFORM, center, { x: 100, y: 0 }, { x: 1, y: 0 }).scale,
		).toBe(0.2)
	})

	it('시작점이 중심과 겹치면 값을 바꾸지 않는다', () => {
		expect(scaleTransform(IDENTITY_TRANSFORM, center, center, { x: 50, y: 0 }).scale).toBe(1)
	})
})

describe('rotateTransform', () => {
	const center = { x: 0, y: 0 }

	it('중심 기준 포인터 각도 변화량을 더한다', () => {
		const next = rotateTransform(
			{ x: 1, y: 2, scale: 1.5, rotate: 10 },
			center,
			{ x: 10, y: 0 },
			{ x: 0, y: 10 },
		)
		expect(next).toEqual({ x: 1, y: 2, scale: 1.5, rotate: 100 })
	})

	it('[-180, 180) 범위로 감아 돌린다', () => {
		// 170° + 30° = 200° → -160°
		const next = rotateTransform(
			{ ...IDENTITY_TRANSFORM, rotate: 170 },
			center,
			{ x: 10, y: 0 },
			{ x: Math.cos(Math.PI / 6) * 10, y: Math.sin(Math.PI / 6) * 10 },
		)
		expect(next.rotate).toBe(-160)
	})

	it('0° 근처(±3°)는 0으로 스냅한다', () => {
		const next = rotateTransform(
			{ ...IDENTITY_TRANSFORM, rotate: -2 },
			center,
			{ x: 10, y: 0 },
			{ x: 10, y: 0 },
		)
		expect(next.rotate).toBe(0)
	})
})

describe('normalizeAngle', () => {
	it('경계값 180·-180·540을 [-180, 180)으로 정규화한다', () => {
		expect(normalizeAngle(180)).toBe(-180)
		expect(normalizeAngle(-180)).toBe(-180)
		expect(normalizeAngle(540)).toBe(-180)
		expect(normalizeAngle(-90)).toBe(-90)
	})
})

describe('isIdentityTransform', () => {
	it('identity만 true', () => {
		expect(isIdentityTransform(IDENTITY_TRANSFORM)).toBe(true)
		expect(isIdentityTransform({ ...IDENTITY_TRANSFORM, rotate: 1 })).toBe(false)
	})
})
