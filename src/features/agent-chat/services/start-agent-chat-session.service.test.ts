import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import {
	createAgentChatSessionRecord,
	saveAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import { startAgentChatSession } from '@/features/agent-chat/services/start-agent-chat-session.service'
import type { User } from '@/payload-types'

vi.mock('@/features/agent-chat/repositories/agent-chat-session.payload.repository', () => ({
	createAgentChatSessionRecord: vi.fn(),
	saveAgentChatSessionRecord: vi.fn(),
}))

const createSession = vi.mocked(createAgentChatSessionRecord)
const saveSession = vi.mocked(saveAgentChatSessionRecord)

const user = { id: 7 } as User
const messages = [
	{
		id: 'user-message',
		role: 'user',
		parts: [{ type: 'text', text: '가이드라인을 찾아줘.' }],
	},
] as AgentChatMessage[]

const toolStep = {
	model: { modelId: 'test-model' },
	toolCalls: [{ toolName: 'searchGuidelines' }],
}

describe('startAgentChatSession', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		createSession.mockResolvedValue({ id: 41 } as never)
	})

	it('요청 메시지로 running 세션을 생성한다', async () => {
		await startAgentChatSession({ messages, pagePath: '/guidelines', user })

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
	})

	it('running 스텝은 저장하지 않고 completed 스텝에서 한 번만 저장한다', async () => {
		const session = await startAgentChatSession({ messages, pagePath: '/guidelines', user })

		await session.recordStep({ status: 'running', step: toolStep })
		expect(saveSession).not.toHaveBeenCalled()

		await session.recordStep({
			status: 'completed',
			text: '찾은 가이드라인입니다.',
			step: toolStep,
		})
		expect(saveSession).toHaveBeenCalledTimes(1)

		const [saved, savedUser] = saveSession.mock.calls[0]
		expect(savedUser).toBe(user)
		const data = saved.toUpdateData()
		expect(data.status).toBe('completed')
		expect(data.messageCount).toBe(2)
		expect(data.usedTools).toEqual([{ name: 'searchGuidelines', callCount: 2 }])
		expect(data.messages[1]).toMatchObject({
			messageId: session.assistantMessageId,
			role: 'assistant',
			text: '찾은 가이드라인입니다.',
		})
	})

	it('종결 후 fail은 no-op이고 완료 세션을 뒤집지 않는다', async () => {
		const session = await startAgentChatSession({ messages, user })

		await session.recordStep({ status: 'completed', text: '완료 응답', step: toolStep })
		expect(saveSession).toHaveBeenCalledTimes(1)

		await session.fail('late error')
		expect(saveSession).toHaveBeenCalledTimes(1)
		expect(saveSession.mock.calls[0][0].toUpdateData().status).toBe('completed')
	})
})
