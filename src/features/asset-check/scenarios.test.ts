import { describe, expect, it } from 'vitest'

import { getCheckScenario } from './scenarios'

describe('getCheckScenario', () => {
	it('maps business card aliases to the stationery scenario', () => {
		for (const key of ['business-card', 'business card', 'name-card', '명함 시나리오']) {
			expect(getCheckScenario(key).key).toBe('stationery')
		}
	})

	it('maps demo aliases to application scenarios', () => {
		expect(getCheckScenario('social post').key).toBe('sns')
		expect(getCheckScenario('web banner').key).toBe('web-visual')
		expect(getCheckScenario('광고 소재').key).toBe('advertisement')
	})

	it('checks photography rules in image mood scenarios', () => {
		expect(getCheckScenario('image-mood').checkKeys).toEqual(
			expect.arrayContaining([
				'photography-ingredient-textures',
				'imagery-misuse',
				'imagery.ai.consistency',
			]),
		)
	})

	it('uses only the web-specific canvas format check', () => {
		const checkKeys = getCheckScenario('web-visual').checkKeys
		expect(checkKeys).toContain('application.web')
		expect(checkKeys).not.toContain('layout.visual.template')
	})
})
