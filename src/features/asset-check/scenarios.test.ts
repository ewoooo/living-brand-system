import { describe, expect, it } from 'vitest'

import { getCheckScenario } from './scenarios'

describe('getCheckScenario', () => {
	it('maps business card aliases to the stationery scenario', () => {
		for (const key of ['business-card', 'business card', 'name-card', '명함 시나리오']) {
			expect(getCheckScenario(key).key).toBe('stationery')
		}
	})
})
