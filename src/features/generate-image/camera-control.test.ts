import { describe, expect, it } from 'vitest'
import {
	cameraAdjustmentRequestSchema,
	composeCameraAdjustmentPrompt,
	resolveCameraControl,
} from './camera-control'

describe('resolveCameraControl', () => {
	it.each([
		[-180, 'rear'],
		[-157.5, 'rear-left'],
		[-112.5, 'left'],
		[-67.5, 'front-left'],
		[-22.5, 'front'],
		[22.5, 'front-right'],
		[67.5, 'right'],
		[112.5, 'rear-right'],
		[157.5, 'rear'],
		[180, 'rear'],
	] as const)('방위각 %d°를 %s 구간으로 해석한다', (azimuthDeg, azimuth) => {
		expect(resolveCameraControl({ azimuthDeg, elevationDeg: 0 }).azimuth).toBe(azimuth)
	})

	it.each([
		[-30, 'low'],
		[-10, 'eye-level'],
		[15, 'elevated'],
		[40, 'high'],
		[70, 'top-down'],
		[90, 'top-down'],
	] as const)('고도각 %d°를 %s 구간으로 해석한다', (elevationDeg, elevation) => {
		expect(resolveCameraControl({ azimuthDeg: 0, elevationDeg }).elevation).toBe(elevation)
	})
})

describe('camera adjustment contract', () => {
	it('생성 장수를 생략하면 한 장으로 정규화한다', () => {
		const result = cameraAdjustmentRequestSchema.parse({
			basePrompt: '{"subject":"유조선"}',
			camera: { azimuthDeg: 0, elevationDeg: 0 },
			profileId: 5,
			seedImage: 'data:image/png;base64,iVBORw0KGgo=',
		})

		expect(result.count).toBe(1)
	})

	it('기존 시점보다 카메라 조정값을 우선하는 최종 프롬프트를 만든다', () => {
		const result = JSON.parse(
			composeCameraAdjustmentPrompt(
				JSON.stringify({
					composition: 'ISO-metric view',
					style: 'technical illustration',
					subject: '유조선',
				}),
				{ azimuth: 'front-right', elevation: 'elevated' },
			),
		)

		expect(result).toMatchObject({
			camera: 'front-right three-quarter view, slightly elevated camera angle',
			composition: 'ISO-metric view',
			style: 'technical illustration',
			subject: '유조선',
		})
		expect(result.camera_rules).toContain('overrides every previous camera angle')
	})

	it.each([
		{ camera: { azimuthDeg: 181, elevationDeg: 0 } },
		{ camera: { azimuthDeg: 0, elevationDeg: 91 } },
		{ basePrompt: 'not json' },
		{ seedImage: 'data:image/svg+xml;base64,PHN2Zz4=' },
	])('계약 밖의 요청을 거부한다: %o', (patch) => {
		expect(
			cameraAdjustmentRequestSchema.safeParse({
				basePrompt: '{"subject":"유조선"}',
				camera: { azimuthDeg: 0, elevationDeg: 0 },
				count: 1,
				profileId: 5,
				seedImage: 'data:image/png;base64,iVBORw0KGgo=',
				...patch,
			}).success,
		).toBe(false)
	})
})
