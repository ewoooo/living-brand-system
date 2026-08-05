import { describe, expect, it } from 'vitest'

import { getCheckScenario } from './check-scenario'

const scenarios = [
	{ key: 'quick', title: '빠른 기본 검수', checkKeys: [] },
	{ key: 'sns', title: 'SNS 콘텐츠 검수', checkKeys: [] },
	{ key: 'web-visual', title: '웹/비주얼 템플릿 검수', checkKeys: [] },
	{ key: 'advertisement', title: '광고 검수', checkKeys: [] },
	{ key: 'stationery', title: '명함/스테이셔너리 검수', checkKeys: [] },
]

describe('getCheckScenario', () => {
	it('prefers an exact Payload key before applying aliases', () => {
		const scenarios = [
			{ key: 'check-model-image', title: '모델 이미지 검수', checkKeys: [] },
			{ key: 'sns-feed', title: 'SNS 콘텐츠 검수', checkKeys: [] },
		]

		expect(getCheckScenario(scenarios, 'sns-feed').key).toBe('sns-feed')
	})

	it('maps business card aliases to the stationery scenario', () => {
		for (const key of ['business-card', 'business card', 'name-card', '명함 시나리오']) {
			expect(getCheckScenario(scenarios, key).key).toBe('stationery')
		}
	})

	it('maps demo aliases to application scenarios', () => {
		expect(getCheckScenario(scenarios, 'social post').key).toBe('sns')
		expect(getCheckScenario(scenarios, 'web banner').key).toBe('web-visual')
		expect(getCheckScenario(scenarios, '광고 소재').key).toBe('advertisement')
	})

	it('falls back to the quick scenario for unknown keys', () => {
		expect(getCheckScenario(scenarios, 'unknown-key').key).toBe('quick')
	})
})
