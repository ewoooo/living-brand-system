import { describe, expect, it, vi } from 'vitest'
import { findPublishedScenarioCheckRecords } from './available-scenario-check.payload.repository'

describe('findPublishedScenarioCheckRecords', () => {
	it('published Rule을 Service용 DTO로 변환한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					executor: 'deterministic',
					key: 'color.palette',
					title: 'Color Palette',
					titleKo: '컬러 팔레트',
				},
				{
					executor: 'heuristic',
					key: 'imagery.style',
					title: 'Imagery Style',
					titleKo: null,
				},
			],
		})
		const user = { role: 'manager' }

		await expect(
			findPublishedScenarioCheckRecords({ payload: { find }, user } as never),
		).resolves.toEqual([
			{
				executor: 'deterministic',
				key: 'color.palette',
				title: 'Color Palette',
				titleKo: '컬러 팔레트',
			},
			{
				executor: 'heuristic',
				key: 'imagery.style',
				title: 'Imagery Style',
				titleKo: undefined,
			},
		])
		expect(find).toHaveBeenCalledWith({
			collection: 'rules',
			depth: 0,
			draft: false,
			limit: 2000,
			overrideAccess: false,
			user,
			where: { _status: { equals: 'published' } },
		})
	})
})
