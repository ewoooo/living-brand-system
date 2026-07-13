import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import {
	createAgentChatSessionRecord,
	updateAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import { startAgentChatSession } from '@/features/agent-chat/services/start-agent-chat-session.service'
import type { User } from '@/payload-types'

vi.mock('@/features/agent-chat/repositories/agent-chat-session.payload.repository', () => ({
	createAgentChatSessionRecord: vi.fn(),
	updateAgentChatSessionRecord: vi.fn(),
}))

const createSession = vi.mocked(createAgentChatSessionRecord)
const updateSession = vi.mocked(updateAgentChatSessionRecord)

describe('startAgentChatSession', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		createSession.mockResolvedValue({ id: 41 } as never)
	})

	it('stores the request and records the completed assistant step', async () => {
		const user = { id: 7 } as User
		const messages = [
			{
				id: 'user-message',
				role: 'user',
				parts: [{ type: 'text', text: '가이드라인을 찾아줘.' }],
			},
		] as AgentChatMessage[]

		const session = await startAgentChatSession({ messages, pagePath: '/guidelines', user })

		expect(createSession).toHaveBeenCalledWith({
			status: 'running',
			pagePath: '/guidelines',
			messageCount: 1,
			messages: [
				{
					messageId: 'user-message',
					role: 'user',
					text: '가이드라인을 찾아줘.',
				},
			],
			user,
		})

		await session.recordStep({
			status: 'completed',
			text: '찾은 가이드라인입니다.',
			step: {
				model: { modelId: 'test-model' },
				toolCalls: [{ toolName: 'searchGuidelines' }],
			},
		})

		expect(updateSession).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 41,
				status: 'completed',
				messageCount: 2,
				usedSkills: [],
				usedTools: [{ name: 'searchGuidelines', callCount: 1 }],
				user,
				messages: [
					expect.objectContaining({ messageId: 'user-message', role: 'user' }),
					expect.objectContaining({
						messageId: session.assistantMessageId,
						role: 'assistant',
						text: '찾은 가이드라인입니다.',
						usedTools: [{ name: 'searchGuidelines', callCount: 1 }],
					}),
				],
			}),
		)
	})
})
