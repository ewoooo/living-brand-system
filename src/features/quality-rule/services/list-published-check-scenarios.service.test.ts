import { describe, expect, it, vi } from 'vitest'
import { findPublishedCheckScenarios } from '../repositories/check-scenario.payload.repository'
import { listPublishedCheckScenarios } from './list-published-check-scenarios.service'

vi.mock('../repositories/check-scenario.payload.repository', () => ({
	findPublishedCheckScenarios: vi.fn(),
}))

describe('listPublishedCheckScenarios', () => {
	it('check-scenario repository의 findPublishedCheckScenarios에 위임한다', async () => {
		const user = { id: 1 } as never
		const scenarios = [{ key: 'quick', title: '빠른 기본 검수', checkKeys: [], aliases: [] }]
		vi.mocked(findPublishedCheckScenarios).mockResolvedValue(scenarios)

		await expect(listPublishedCheckScenarios(user)).resolves.toBe(scenarios)
		expect(findPublishedCheckScenarios).toHaveBeenCalledWith(user)
	})
})
