import { describe, expect, it } from 'vitest'
import { toRuntimeCheckMessages } from '@/features/asset-check/utils/check-messages'

describe('toRuntimeCheckMessages', () => {
	it('maps Payload Check message fields to runtime status keys', () => {
		expect(
			toRuntimeCheckMessages({
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
