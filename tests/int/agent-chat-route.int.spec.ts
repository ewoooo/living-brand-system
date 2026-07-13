import { describe, expect, it } from 'vitest'
import { parseAgentChatRequest } from '@/app/api/agent-chat/parse-agent-chat-request'

describe('agent chat route request parsing', () => {
	it('rejects malformed JSON', async () => {
		const request = new Request('http://localhost/api/agent-chat', {
			body: '{',
			method: 'POST',
		})

		const parsed = await parseAgentChatRequest(request)

		expect(parsed.success).toBe(false)
	})

	it('rejects invalid message shape', async () => {
		const request = new Request('http://localhost/api/agent-chat', {
			body: JSON.stringify({ messages: [{}] }),
			method: 'POST',
		})

		const parsed = await parseAgentChatRequest(request)

		expect(parsed.success).toBe(false)
	})
})
