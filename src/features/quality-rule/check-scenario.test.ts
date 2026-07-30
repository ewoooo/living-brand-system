import { describe, expect, it } from 'vitest'

import { getCheckScenario, INITIAL_CHECK_SCENARIOS } from './check-scenario'

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
			expect(getCheckScenario(INITIAL_CHECK_SCENARIOS, key).key).toBe('stationery')
		}
	})

	it('maps demo aliases to application scenarios', () => {
		expect(getCheckScenario(INITIAL_CHECK_SCENARIOS, 'social post').key).toBe('sns')
		expect(getCheckScenario(INITIAL_CHECK_SCENARIOS, 'web banner').key).toBe('web-visual')
		expect(getCheckScenario(INITIAL_CHECK_SCENARIOS, '광고 소재').key).toBe('advertisement')
	})

	it('checks photography rules in image mood scenarios', () => {
		const scenario = getCheckScenario(INITIAL_CHECK_SCENARIOS, 'image-mood')
		expect(scenario.checkKeys).toEqual(
			expect.arrayContaining([
				'photography-ingredient-textures',
				'imagery-misuse',
				'imagery.ai.consistency',
			]),
		)
	})

	it('uses only the web-specific canvas format check', () => {
		const checkKeys = getCheckScenario(INITIAL_CHECK_SCENARIOS, 'web-visual').checkKeys
		expect(checkKeys).toContain('application.web')
		expect(checkKeys).not.toContain('layout.visual.template')
	})
})
