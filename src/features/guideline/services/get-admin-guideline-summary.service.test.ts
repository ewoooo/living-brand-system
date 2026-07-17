import { describe, expect, it, vi } from 'vitest'
import { listAdminGuidelineSummaryDocuments } from '@/features/guideline/repositories/admin-guideline-summary.payload.repository'
import { getAdminGuidelineSummary } from './get-admin-guideline-summary.service'

vi.mock('@/features/guideline/repositories/admin-guideline-summary.payload.repository', () => ({
	listAdminGuidelineSummaryDocuments: vi.fn(),
}))

describe('getAdminGuidelineSummary', () => {
	it('문서를 breadcrumb 깊이별로 분류하고 문서·Block Rule 배치를 합산한다', async () => {
		vi.mocked(listAdminGuidelineSummaryDocuments).mockResolvedValue([
			{ breadcrumbDocumentIds: [1], ruleCount: 1 },
			{ breadcrumbDocumentIds: [1, 2], ruleCount: 2 },
			{ breadcrumbDocumentIds: [1, 2, 3], ruleCount: 0 },
			{ breadcrumbDocumentIds: [], ruleCount: 1 },
		])

		await expect(getAdminGuidelineSummary()).resolves.toEqual({
			checks: 4,
			chapters: 1,
			sections: 1,
			pages: 1,
		})
	})
})
