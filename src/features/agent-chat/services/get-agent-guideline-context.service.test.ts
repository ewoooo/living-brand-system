import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findAgentGuidelineDocument,
	findGuidelineSearchPhraseCandidates,
	findGuidelineSearchTermCandidates,
	listGuidelineDocuments,
} from '../repositories/agent-guideline-context.payload.repository'
import {
	listAgentGuidelineDocuments,
	readAgentGuidelineDocument,
	searchAgentGuidelines,
} from './get-agent-guideline-context.service'

vi.mock('../repositories/agent-guideline-context.payload.repository', () => ({
	findAgentGuidelineDocument: vi.fn(),
	findGuidelineSearchPhraseCandidates: vi.fn(),
	findGuidelineSearchTermCandidates: vi.fn(),
	listGuidelineDocuments: vi.fn(),
}))

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
				rules: [
					{
						key: 'logo.size.minimum',
						title: 'Minimum size',
						tier: 'required',
					},
				],
				chapterSlug: 'brand',
				chapterTitle: 'Brand',
			},
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

	it('토픽 Check도 Agent 결과에 포함한다', async () => {
		vi.mocked(findAgentGuidelineDocument).mockResolvedValue({
			collection: 'guideline-documents',
			document: {
				id: 2,
				title: 'Brand Core',
				slug: 'brand-core',
				description: null,
				descriptionText: '',
				rules: [
					{
						key: 'brand.core',
						title: 'Brand core',
						tier: 'recommended',
					},
				],
				chapterSlug: 'brand',
				chapterTitle: 'Brand',
			},
		} as never)

		const result = await readAgentGuidelineDocument(
			{ id: 1 },
			{
				collection: 'guideline-documents',
				id: '2',
			},
		)

		expect(result?.checks).toEqual([{ key: 'brand.core', title: 'Brand core' }])
	})

	it('토픽 목록에 소속 챕터 ID를 포함한다', async () => {
		vi.mocked(listGuidelineDocuments).mockResolvedValue([
			{ id: 7, title: 'Primary Logo', chapterId: 2 },
		])

		await expect(listAgentGuidelineDocuments({ id: 1 })).resolves.toEqual([
			{
				chapterId: '2',
				collection: 'guideline-documents',
				id: '7',
				title: 'Primary Logo',
			},
		])
	})
})
