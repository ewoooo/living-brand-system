import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveAgentChatReaction } from '@/features/agent-chat/services/save-agent-chat-reaction.client'

describe('saveAgentChatReaction', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('posts the selected reaction for a chat session', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
		vi.stubGlobal('fetch', fetchMock)

		await saveAgentChatReaction({
			agentChatSessionId: 123,
			messageId: 'msg_1',
			reaction: 'good',
		})

		expect(fetchMock).toHaveBeenCalledWith('/api/agent-chat/reaction', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ agentChatSessionId: 123, messageId: 'msg_1', reaction: 'good' }),
		})
	})
})
