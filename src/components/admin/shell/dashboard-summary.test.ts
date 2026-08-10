import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getAdminGuidelineSummary } from '@/features/guideline/services/get-admin-guideline-summary.service'
import { DashboardSummary } from './dashboard-summary'

vi.mock('@/features/guideline/services/get-admin-guideline-summary.service', () => ({
	getAdminGuidelineSummary: vi.fn(),
}))

describe('DashboardSummary', () => {
	it('실제 0건은 표시한다', async () => {
		vi.mocked(getAdminGuidelineSummary).mockResolvedValue({
			checks: 0,
			chapters: 0,
			sections: 0,
			pages: 0,
		})

		render(await DashboardSummary())

		expect(screen.getByText('Check: 0')).toBeInTheDocument()
		expect(screen.getByText('장: 0')).toBeInTheDocument()
	})

	it('집계 조회 실패를 가짜 0건으로 숨기지 않는다', async () => {
		vi.mocked(getAdminGuidelineSummary).mockRejectedValue(new Error('db down'))

		await expect(DashboardSummary()).rejects.toThrow('db down')
	})
})
