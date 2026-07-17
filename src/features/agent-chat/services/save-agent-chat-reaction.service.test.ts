import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findOwnedAgentChatSessionMessages,
	saveAgentChatSessionReaction as saveAgentChatSessionReactionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import type { User } from '@/payload-types'
import { saveAgentChatReaction } from './save-agent-chat-reaction.service'

vi.mock('@/features/agent-chat/repositories/agent-chat-session.payload.repository', () => ({
	findOwnedAgentChatSessionMessages: vi.fn(),
	saveAgentChatSessionReaction: vi.fn(),
}))

const user = { id: 7 } as User

describe('saveAgentChatReaction', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-07-17T00:00:00.000Z'))
	})
	afterEach(() => vi.useRealTimers())

	it('소유 세션의 assistant 대상만 반응과 시각을 갱신한다', async () => {
		vi.mocked(saveAgentChatSessionReactionRecord).mockResolvedValue(true)
		vi.mocked(findOwnedAgentChatSessionMessages).mockResolvedValue({
			id: 41,
			messages: [
				{ messageId: 'u-1', role: 'user' },
				{ messageId: 'a-1', role: 'assistant' },
			],
		})

		await expect(
			saveAgentChatReaction({
				agentChatSessionId: 41,
				messageId: 'a-1',
				reaction: 'good',
				user,
			}),
		).resolves.toEqual({ id: 41 })
		expect(saveAgentChatSessionReactionRecord).toHaveBeenCalledWith({
			id: 41,
			messageId: 'a-1',
			reaction: 'good',
			reactedAt: '2026-07-17T00:00:00.000Z',
			user,
		})
	})

	it('세션이나 assistant 메시지가 없으면 저장하지 않는다', async () => {
		vi.mocked(findOwnedAgentChatSessionMessages)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({
				id: 41,
				messages: [{ messageId: 'u-1', role: 'user' }],
			})

		await expect(
			saveAgentChatReaction({
				agentChatSessionId: 41,
				messageId: 'a-1',
				reaction: 'bad',
				user,
			}),
		).resolves.toBeNull()
		await expect(
			saveAgentChatReaction({
				agentChatSessionId: 41,
				messageId: 'u-1',
				reaction: 'bad',
				user,
			}),
		).resolves.toBeNull()
		expect(saveAgentChatSessionReactionRecord).not.toHaveBeenCalled()
	})
})
