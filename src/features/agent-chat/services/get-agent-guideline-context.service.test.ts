import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findAgentCheckDocuments,
	findAgentGuidelineDocument,
	findGuidelineSearchPhraseCandidates,
	findGuidelineSearchTermCandidates,
	listGuidelineDocuments,
} from '../repositories/agent-guideline-context.payload.repository'
import {
	listAgentChecks,
	listAgentGuidelineDocuments,
	readAgentGuidelineDocument,
	searchAgentGuidelines,
} from './get-agent-guideline-context.service'

vi.mock('../repositories/agent-guideline-context.payload.repository', () => ({
	findAgentCheckDocuments: vi.fn(),
	findAgentGuidelineDocument: vi.fn(),
	findGuidelineSearchPhraseCandidates: vi.fn(),
	findGuidelineSearchTermCandidates: vi.fn(),
	listGuidelineDocuments: vi.fn(),
}))

const lexical = (text: string) =>
	({ root: { children: [{ type: 'paragraph', children: [{ text }] }] } }) as never

describe('listAgentChecks', () => {
	beforeEach(() => vi.clearAllMocks())

	it('구조화 evidence를 평문화하고 Check key 순서로 조립한다', async () => {
		vi.mocked(findAgentCheckDocuments).mockResolvedValue([
			{
				id: 7,
				description: lexical('Use the legal name.'),
				headerImage: null,
				blocks: [],
				checks: [
					{
						key: 'name.input',
						title: 'Name input',
						tier: 'required',
					},
				],
			},
			{
				id: 8,
				description: lexical('Follow the color palette.'),
				headerImage: null,
				blocks: [],
				checks: [
					{
						key: 'color.palette',
						title: 'Color palette',
						tier: 'recommended',
					},
				],
			},
		] as never)

		await expect(listAgentChecks({ id: 1 })).resolves.toEqual([
			{
				evidence: 'Follow the color palette.',
				key: 'color.palette',
				tier: 'recommended',
				title: 'Color palette',
			},
			{
				evidence: 'Use the legal name.',
				key: 'name.input',
				tier: 'required',
				title: 'Name input',
			},
		])
	})
})

describe('searchAgentGuidelines', () => {
	beforeEach(() => vi.clearAllMocks())

	it('문구 결과를 검색어 결과로 보강해 중복 제거 후 제목 일치순으로 반환한다', async () => {
		vi.mocked(findGuidelineSearchPhraseCandidates).mockResolvedValue([
			{ title: 'Brand Product', collection: 'guideline-documents', id: '54' },
			{ title: 'Brand Model', collection: 'other-documents', id: '99' },
		])
		vi.mocked(findGuidelineSearchTermCandidates).mockResolvedValue([
			{ title: 'Brand Product', collection: 'guideline-documents', id: '54' },
			{ title: 'Brand Model', collection: 'guideline-documents', id: '55' },
		])

		await expect(searchAgentGuidelines({ id: 1 }, { query: ' Brand Model ' })).resolves.toEqual(
			[
				{ title: 'Brand Model', collection: 'guideline-documents', id: '55' },
				{ title: 'Brand Product', collection: 'guideline-documents', id: '54' },
			],
		)
		expect(findGuidelineSearchPhraseCandidates).toHaveBeenCalledWith({ id: 1 }, 'Brand Model')
		expect(findGuidelineSearchTermCandidates).toHaveBeenCalledWith({ id: 1 }, [
			'Brand',
			'Model',
		])
	})

	it('빈 검색어는 Repository를 호출하지 않는다', async () => {
		await expect(searchAgentGuidelines({ id: 1 }, { query: '  ' })).resolves.toEqual([])

		expect(findGuidelineSearchPhraseCandidates).not.toHaveBeenCalled()
		expect(findGuidelineSearchTermCandidates).not.toHaveBeenCalled()
	})
})

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
				descriptionText: '',
				blocks: [],
				checks: [
					{
						key: 'logo.size.minimum',
						title: 'Minimum size',
						tier: 'required',
					},
				],
				parent: 2,
				breadcrumbs: [
					{ doc: 1, label: 'Brand', url: '/guideline/brand' },
					{ doc: 2, label: 'Logo', url: '/guideline/brand/logo' },
					{ doc: 7, label: 'Primary Logo', url: '/guideline/brand/logo/primary-logo' },
				],
			},
			children: [],
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
				descriptionText: '',
				checks: [
					{
						key: 'brand.core',
						title: 'Brand core',
						tier: 'recommended',
					},
				],
				breadcrumbs: [
					{ doc: 1, label: 'Brand', url: '/guideline/brand' },
					{ doc: 2, label: 'Brand Core', url: '/guideline/brand/brand-core' },
				],
			},
			children: [{ id: 7, title: 'Primary Logo', slug: 'primary-logo', description: null }],
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
				parentId: 2,
				level: 3,
			},
		])

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
