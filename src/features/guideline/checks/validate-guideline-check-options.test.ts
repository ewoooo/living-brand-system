import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGuidelineRuleCheckerSummary } from '../repositories/guideline-document.payload.repository'
import { validateGuidelineCheckOptions } from './validate-guideline-check-options'

vi.mock('../repositories/guideline-document.payload.repository', () => ({
	getGuidelineRuleCheckerSummary: vi.fn(),
}))

const getChecker = vi.mocked(getGuidelineRuleCheckerSummary)

describe('validateGuidelineCheckOptions', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('관계 ID만 있으면 Repository가 읽은 checkerKey로 Contrast options를 검증한다', async () => {
		getChecker.mockResolvedValue({ checkerKey: 'contrast', executor: 'deterministic' })
		const req = {} as never

		await expect(
			validateGuidelineCheckOptions(null, {
				req,
				siblingData: { executor: 'deterministic', checker: 7 },
			} as never),
		).resolves.toBe('최소 대비율은 1 이상 21 이하의 숫자로 입력하세요.')
		expect(getChecker).toHaveBeenCalledWith(req, 7)
	})
})
