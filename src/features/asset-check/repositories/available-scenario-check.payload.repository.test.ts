import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findPublishedScenarioCheckRecords } from './available-scenario-check.payload.repository'

const mocks = vi.hoisted(() => ({
	collectSources: vi.fn(),
	findDocuments: vi.fn(),
}))

vi.mock('@/features/guideline/checks/collect-guideline-check-sources', () => ({
	collectGuidelineCheckSources: mocks.collectSources,
}))
vi.mock('@/features/guideline/repositories/published-guideline-checks.payload.repository', () => ({
	findPublishedUnifiedGuidelineCheckDocuments: mocks.findDocuments,
}))

describe('findPublishedScenarioCheckRecords', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('published Guideline Check 레코드를 Service용 DTO로 변환한다', async () => {
		const document = { title: 'Color' }
		mocks.findDocuments.mockResolvedValue({ documents: [document] })
		mocks.collectSources.mockReturnValue([
			{
				blockName: 'Main palette',
				check: {
					checker: { executor: 'deterministic' },
					key: 'color.palette',
					title: 'Color Palette',
					titleKo: '컬러 팔레트',
				},
			},
		])
		const payload = {}
		const user = { role: 'manager' }

		await expect(
			findPublishedScenarioCheckRecords({ payload, user } as never),
		).resolves.toEqual([
			{
				blockName: 'Main palette',
				documentTitle: 'Color',
				executor: 'deterministic',
				key: 'color.palette',
				title: 'Color Palette',
				titleKo: '컬러 팔레트',
			},
		])
		expect(mocks.findDocuments).toHaveBeenCalledWith(payload, {
			overrideAccess: false,
			user,
		})
		expect(mocks.collectSources).toHaveBeenCalledWith(document)
	})
})
