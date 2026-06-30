import { describe, expect, it } from 'vitest'
import { getAgentChatErrorMessage } from '@/features/agent-chat/hooks/use-agent-chat'

describe('agent chat errors', () => {
	it('uses JSON response messages', async () => {
		const response = Response.json({ message: 'Unauthorized' }, { status: 401 })

		await expect(getAgentChatErrorMessage(response)).resolves.toBe('Unauthorized')
	})

	it('falls back to status text', async () => {
		const response = new Response('nope', { status: 500, statusText: 'Internal Server Error' })

		await expect(getAgentChatErrorMessage(response)).resolves.toBe('Internal Server Error')
	})
})
