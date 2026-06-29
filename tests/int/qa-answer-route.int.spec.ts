import { describe, expect, it } from 'vitest'
import { parseQaAnswerRequest } from '@/app/api/qa/answer/route'

describe('QA answer route request parsing', () => {
	it('rejects malformed JSON', async () => {
		const request = new Request('http://localhost/api/qa/answer', {
			body: '{',
			method: 'POST',
		})

		const parsed = await parseQaAnswerRequest(request)

		expect(parsed.success).toBe(false)
	})

	it('rejects invalid message shape', async () => {
		const request = new Request('http://localhost/api/qa/answer', {
			body: JSON.stringify({ messages: [{}] }),
			method: 'POST',
		})

		const parsed = await parseQaAnswerRequest(request)

		expect(parsed.success).toBe(false)
	})
})
