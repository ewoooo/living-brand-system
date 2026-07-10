import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findAgentGuidelineDocument } from '../repositories/agent-guideline-context.payload.repository'
import { readAgentGuidelineDocument } from './get-agent-guideline-context.service'

vi.mock('../repositories/agent-guideline-context.payload.repository', () => ({
	findAgentGuidelineDocument: vi.fn(),
}))

describe('readAgentGuidelineDocument', () => {
	beforeEach(() => vi.clearAllMocks())

	it('Page와 Block의 Check를 Agent 결과에 포함한다', async () => {
		vi.mocked(findAgentGuidelineDocument).mockResolvedValue({
			collection: 'guideline-pages',
			page: {
				id: 7,
				title: 'Primary Logo',
				slug: 'primary-logo',
				description: null,
				blocks: [],
				section: { id: 2, title: 'Logo', slug: 'logo' },
			},
			checks: [
				{
					key: 'logo.size.minimum',
					title: 'Minimum size',
					evidence: null,
					tier: 'required',
				},
			],
		} as never)

		const result = await readAgentGuidelineDocument(
			{ id: 1 },
			{
				collection: 'guideline-pages',
				id: '7',
			},
		)

		expect(result?.checks).toEqual([{ key: 'logo.size.minimum', title: 'Minimum size' }])
		expect(result?.content).toContain('Checks:\n- logo.size.minimum: Minimum size')
	})

	it('Section Check도 Agent 결과에 포함한다', async () => {
		vi.mocked(findAgentGuidelineDocument).mockResolvedValue({
			collection: 'guideline-sections',
			section: { id: 2, title: 'Brand Core', slug: 'brand-core', description: null },
			pages: [],
			checks: [
				{ key: 'brand.core', title: 'Brand core', evidence: null, tier: 'recommended' },
			],
		} as never)

		const result = await readAgentGuidelineDocument(
			{ id: 1 },
			{
				collection: 'guideline-sections',
				id: '2',
			},
		)

		expect(result?.checks).toEqual([{ key: 'brand.core', title: 'Brand core' }])
	})
})
