import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findPublishedMcpGuideline,
	listPublishedMcpGuidelineChecks,
	listPublishedMcpGuidelineDocuments,
} from '../repositories/mcp-guideline.payload.repository'
import {
	findMcpChecks,
	findMcpGuideline,
	findMcpGuidelineDocuments,
} from './find-mcp-guideline.service'

vi.mock('../repositories/mcp-guideline.payload.repository', () => ({
	findPublishedMcpGuideline: vi.fn(),
	listPublishedMcpGuidelineChecks: vi.fn(),
	listPublishedMcpGuidelineDocuments: vi.fn(),
}))

describe('MCP guideline read service', () => {
	beforeEach(() => vi.resetAllMocks())

	it('문서 level 필터와 level 3 기본 페이지 정책을 적용한다', async () => {
		const pages = Array.from({ length: 21 }, (_, index) => ({
			id: index + 1,
			breadcrumbs: [{}, {}, {}],
		}))
		vi.mocked(listPublishedMcpGuidelineDocuments).mockResolvedValue([
			{ id: 99, breadcrumbs: [{}] },
			...pages,
		] as never)
		const context = { user: { id: 1 } } as never

		await expect(findMcpGuidelineDocuments(context, { level: 3 })).resolves.toMatchObject({
			docs: pages.slice(0, 20),
			hasNextPage: true,
			hasPrevPage: false,
			nextPage: 2,
			page: 1,
			pagingCounter: 1,
			prevPage: null,
			totalDocs: 21,
			totalPages: 2,
		})
		expect(listPublishedMcpGuidelineDocuments).toHaveBeenCalledWith(context, 'ko')
	})

	it('Check를 key 순으로 정렬한 뒤 요청 페이지를 반환한다', async () => {
		vi.mocked(listPublishedMcpGuidelineChecks).mockResolvedValue([
			{ key: 'z.last' },
			{ key: 'a.first' },
		] as never)
		const context = {} as never

		await expect(
			findMcpChecks(context, { limit: 1, locale: 'en', page: 2 }),
		).resolves.toMatchObject({
			docs: [{ key: 'z.last' }],
			page: 2,
			totalDocs: 2,
			totalPages: 2,
		})
		expect(listPublishedMcpGuidelineChecks).toHaveBeenCalledWith(context, 'en')
	})

	it('Guideline global 조회를 Repository에 위임한다', async () => {
		const guideline = { id: 1, companyName: 'PROTO' }
		vi.mocked(findPublishedMcpGuideline).mockResolvedValue(guideline as never)
		const context = {} as never

		await expect(findMcpGuideline(context)).resolves.toBe(guideline)
		expect(findPublishedMcpGuideline).toHaveBeenCalledWith(context, 'ko')
	})
})
