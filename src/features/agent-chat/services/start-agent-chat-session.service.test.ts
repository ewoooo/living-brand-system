import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import {
	createAgentChatSessionRecord,
	findLatestAgentChatSessionMessagesContainingAny,
	saveAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import { startAgentChatSession } from '@/features/agent-chat/services/start-agent-chat-session.service'
import type { User } from '@/payload-types'

vi.mock('@/features/agent-chat/repositories/agent-chat-session.payload.repository', () => ({
	createAgentChatSessionRecord: vi.fn(),
	findLatestAgentChatSessionMessagesContainingAny: vi.fn(),
	saveAgentChatSessionRecord: vi.fn(),
}))

const createSession = vi.mocked(createAgentChatSessionRecord)
const findPrevious = vi.mocked(findLatestAgentChatSessionMessagesContainingAny)
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
		createSession.mockResolvedValue({ id: 41 })
		findPrevious.mockResolvedValue([])
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

	it('스트림 스텝은 저장하지 않고 finalize에서 한 번만 저장한다', async () => {
		const session = await startAgentChatSession({ messages, pagePath: '/guidelines', user })

		await session.recordStep({ step: toolStep })
		expect(saveSession).not.toHaveBeenCalled()

		await session.recordStep({
			text: '찾은 가이드라인입니다.',
			step: toolStep,
		})
		expect(saveSession).not.toHaveBeenCalled()

		await session.finalize()
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

		await session.recordStep({ text: '완료 응답', step: toolStep })
		await session.finalize()
		expect(saveSession).toHaveBeenCalledTimes(1)

		await session.fail('late error')
		expect(saveSession).toHaveBeenCalledTimes(1)
		expect(saveSession.mock.calls[0][0].toUpdateData().status).toBe('completed')
	})

	it('finalize는 completed 신호 없이 끝난 턴을 종결 저장한다', async () => {
		const session = await startAgentChatSession({ messages, user })

		await session.recordStep({ step: toolStep })
		await session.finalize()

		expect(saveSession).toHaveBeenCalledTimes(1)
		const data = saveSession.mock.calls[0][0].toUpdateData()
		expect(data.status).toBe('completed')
		expect(data.usedTools).toEqual([{ name: 'searchGuidelines', callCount: 1 }])
	})

	it('이미 종결된 세션에서 finalize는 no-op이다', async () => {
		const session = await startAgentChatSession({ messages, user })

		await session.recordStep({ text: '완료 응답', step: toolStep })
		await session.finalize()
		await session.finalize()

		expect(saveSession).toHaveBeenCalledTimes(1)
	})

	it('중단된 세션은 failed로 한 번 저장한다', async () => {
		const session = await startAgentChatSession({ messages, user })

		await session.recordStep({ text: '부분 응답', step: toolStep })
		await session.fail('Agent response interrupted.')

		expect(saveSession).toHaveBeenCalledTimes(1)
		expect(saveSession.mock.calls[0][0].toUpdateData()).toMatchObject({
			status: 'failed',
			errorMessage: 'Agent response interrupted.',
		})
	})

	it('히스토리 assistant 메시지를 백필해서 세션을 생성한다', async () => {
		const historyMessages = [
			{
				id: 'user-1',
				role: 'user',
				parts: [{ type: 'text', text: '가이드라인을 찾아줘.' }],
			},
			{
				id: 'assistant-1',
				role: 'assistant',
				parts: [{ type: 'text', text: '가이드라인입니다.' }],
			},
			{
				id: 'user-2',
				role: 'user',
				parts: [{ type: 'text', text: '더 자세히.' }],
			},
		] as AgentChatMessage[]
		findPrevious.mockResolvedValue([
			{
				messageId: 'assistant-1',
				role: 'assistant',
				text: '가이드라인입니다.',
				usedTools: [{ name: 'loadSkill', callCount: 1 }],
				aiUsage: { model: 'test-model', callCount: 1, totalTokens: 120 },
			},
		])

		await startAgentChatSession({ messages: historyMessages, user })

		expect(findPrevious).toHaveBeenCalledWith(['assistant-1'], user)
		const created = createSession.mock.calls[0][0]
		expect(created.messages?.[1]).toMatchObject({
			messageId: 'assistant-1',
			usedTools: [{ name: 'loadSkill', callCount: 1 }],
			aiUsage: { model: 'test-model', callCount: 1, totalTokens: 120 },
		})
	})
})
