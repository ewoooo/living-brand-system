import { describe, expect, it } from 'vitest'
import { toCheckRuleMessages } from '@/features/asset-check/utils/check-rule-messages'

describe('toCheckRuleMessages', () => {
	it('maps Payload rule message fields to check status keys', () => {
		expect(
			toCheckRuleMessages({
				pass: 'pass message',
				ok: 'ok message',
				needsReview: 'review message',
				fail: 'fail message',
			}),
		).toEqual({
			pass: 'pass message',
			ok: 'ok message',
			needs_review: 'review message',
			fail: 'fail message',
		})
	})
})
