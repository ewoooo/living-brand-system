import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { findAdminGuidelineSummary } from './admin-guideline-summary.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('findAdminGuidelineSummary', () => {
	it('통합 문서를 breadcrumb 깊이별로 한 번 집계한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{ breadcrumbs: [{}], checks: [{ key: 'chapter' }], blocks: [] },
				{ breadcrumbs: [{}, {}], checks: [], blocks: [{ checks: [{ key: 'section' }] }] },
				{ breadcrumbs: [{}, {}, {}], checks: [{ key: 'page' }], blocks: [] },
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await expect(findAdminGuidelineSummary()).resolves.toEqual({
			checks: 3,
			chapters: 1,
			sections: 1,
			pages: 1,
		})
		expect(find).toHaveBeenCalledTimes(1)
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({ collection: 'guideline-documents' }),
		)
	})
})
