import { describe, expect, it, vi } from 'vitest'
import { getRuleCheckerSummary } from './rule-checker.payload.repository'

describe('getRuleCheckerSummary', () => {
	it('Rule 저장에 필요한 Checker 계약만 읽는다', async () => {
		const findByID = vi.fn().mockResolvedValue({
			checkerKey: 'contrast',
			executor: 'deterministic',
			implementationKey: 'ignored',
		})
		const user = { id: 7 }
		const req = { payload: { findByID }, user } as never

		await expect(getRuleCheckerSummary(req, 4)).resolves.toEqual({
			checkerKey: 'contrast',
			executor: 'deterministic',
		})
		expect(findByID).toHaveBeenCalledWith(
			expect.objectContaining({ overrideAccess: false, req, user }),
		)
	})
})
