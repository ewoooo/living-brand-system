import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRuleCheckerSummary } from './repositories/rule-checker.payload.repository'
import { validateRuleOptions } from './validate-rule-options'

vi.mock('./repositories/rule-checker.payload.repository', () => ({
	getRuleCheckerSummary: vi.fn(),
}))

const getChecker = vi.mocked(getRuleCheckerSummary)

describe('validateRuleOptions', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('관계 ID만 있으면 Repository가 읽은 checkerKey로 Contrast options를 검증한다', async () => {
		getChecker.mockResolvedValue({ checkerKey: 'contrast', executor: 'deterministic' })
		const req = {} as never

		await expect(
			validateRuleOptions(null, {
				req,
				siblingData: { executor: 'deterministic', checker: 7 },
			} as never),
		).resolves.toBe('최소 대비율은 1 이상 21 이하의 숫자로 입력하세요.')
		expect(getChecker).toHaveBeenCalledWith(req, 7)
	})
})
