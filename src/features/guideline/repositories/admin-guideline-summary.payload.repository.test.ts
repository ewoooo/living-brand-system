import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { listAdminGuidelineSummaryDocuments } from './admin-guideline-summary.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('listAdminGuidelineSummaryDocuments', () => {
	it('통합 문서를 Rule 배치 수 DTO로 변환한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					rules: [11],
					blocks: [{ rules: [12, 13] }],
				},
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await expect(listAdminGuidelineSummaryDocuments()).resolves.toEqual([
			{
				ruleCount: 3,
			},
		])
		expect(find).toHaveBeenCalledTimes(1)
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({ collection: 'guideline-documents' }),
		)
	})
})
