import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findAgentGuidelineDocument,
	listGuidelineDocuments,
} from '../repositories/agent-guideline-context.payload.repository'
import {
	listAgentGuidelineDocuments,
	readAgentGuidelineDocument,
} from './get-agent-guideline-context.service'

vi.mock('../repositories/agent-guideline-context.payload.repository', () => ({
	findAgentGuidelineDocument: vi.fn(),
	listGuidelineDocuments: vi.fn(),
}))

describe('readAgentGuidelineDocument', () => {
	beforeEach(() => vi.clearAllMocks())

	it('Page와 Block의 Check를 통합 문서 Agent 결과에 포함한다', async () => {
		vi.mocked(findAgentGuidelineDocument).mockResolvedValue({
			collection: 'guideline-documents',
			document: {
				id: 7,
				title: 'Primary Logo',
				slug: 'primary-logo',
				description: null,
				blocks: [],
				parent: 2,
				breadcrumbs: [
					{ doc: 1, label: 'Brand', url: '/guideline/brand' },
					{ doc: 2, label: 'Logo', url: '/guideline/brand/logo' },
					{ doc: 7, label: 'Primary Logo', url: '/guideline/brand/logo/primary-logo' },
				],
			},
			children: [],
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
				collection: 'guideline-documents',
				id: '7',
			},
		)

		expect(result?.checks).toEqual([{ key: 'logo.size.minimum', title: 'Minimum size' }])
		expect(result?.content).toContain('Checks:\n- logo.size.minimum: Minimum size')
	})

	it('Section Check와 하위 문서도 Agent 결과에 포함한다', async () => {
		vi.mocked(findAgentGuidelineDocument).mockResolvedValue({
			collection: 'guideline-documents',
			document: {
				id: 2,
				title: 'Brand Core',
				slug: 'brand-core',
				description: null,
				breadcrumbs: [
					{ doc: 1, label: 'Brand', url: '/guideline/brand' },
					{ doc: 2, label: 'Brand Core', url: '/guideline/brand/brand-core' },
				],
			},
			children: [{ id: 7, title: 'Primary Logo', slug: 'primary-logo', description: null }],
			checks: [
				{ key: 'brand.core', title: 'Brand core', evidence: null, tier: 'recommended' },
			],
		} as never)

		const result = await readAgentGuidelineDocument(
			{ id: 1 },
			{
				collection: 'guideline-documents',
				id: '2',
			},
		)

		expect(result?.checks).toEqual([{ key: 'brand.core', title: 'Brand core' }])
		expect(result?.relatedDocuments).toEqual([{ id: '7', title: 'Primary Logo' }])
	})

	it('통합 문서 목록에 깊이와 부모 ID를 포함한다', async () => {
		vi.mocked(listGuidelineDocuments).mockResolvedValue([
			{
				id: 7,
				title: 'Primary Logo',
				parent: 2,
				breadcrumbs: [
					{ doc: 1, label: 'Brand', url: '/guideline/brand' },
					{ doc: 2, label: 'Logo', url: '/guideline/brand/logo' },
					{ doc: 7, label: 'Primary Logo', url: '/guideline/brand/logo/primary-logo' },
				],
			},
		] as never)

		await expect(listAgentGuidelineDocuments({ id: 1 })).resolves.toEqual([
			{
				collection: 'guideline-documents',
				id: '7',
				level: 3,
				parentId: '2',
				title: 'Primary Logo',
			},
		])
	})
})
