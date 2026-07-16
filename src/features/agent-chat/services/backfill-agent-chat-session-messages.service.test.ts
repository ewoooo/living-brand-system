import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findLatestAgentChatSessionContainingMessage } from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import { backfillAgentChatSessionMessages } from '@/features/agent-chat/services/backfill-agent-chat-session-messages.service'
import type { AgentChatSessionMessageInput } from '@/features/agent-chat/types'
import type { AgentChatSession as AgentChatSessionRecord, User } from '@/payload-types'

vi.mock('@/features/agent-chat/repositories/agent-chat-session.payload.repository', () => ({
	findLatestAgentChatSessionContainingMessage: vi.fn(),
}))

const findPrevious = vi.mocked(findLatestAgentChatSessionContainingMessage)

const user = { id: 7 } as User

const history: AgentChatSessionMessageInput[] = [
	{ messageId: 'u-1', role: 'user', text: '가이드라인 알려줘' },
	{ messageId: 'a-1', role: 'assistant', text: '가이드라인입니다.', reaction: 'good' },
	{ messageId: 'u-2', role: 'user', text: '더 자세히' },
]

const previousRecord = {
	id: 21,
	messages: [
		{ messageId: 'u-1', role: 'user', text: '가이드라인 알려줘' },
		{
			messageId: 'a-1',
			role: 'assistant',
			text: '가이드라인입니다.',
			reaction: 'bad',
			usedTools: [{ name: 'loadSkill', callCount: 1, id: 'row-1' }],
			usedSkills: [{ name: 'Guideline Curator', callCount: 1, id: 'row-2' }],
			aiUsage: {
				model: 'claude-sonnet-4-6',
				callCount: 2,
				inputTokens: 100,
				outputTokens: 20,
				totalTokens: 120,
				cacheReadInputTokens: 0,
				cacheWriteInputTokens: 0,
				reasoningTokens: 0,
				rawUsage: { steps: [{ raw: true }] },
			},
		},
	],
} as unknown as AgentChatSessionRecord

describe('backfillAgentChatSessionMessages', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('히스토리 assistant 메시지에 직전 레코드의 메타데이터를 복사한다', async () => {
		findPrevious.mockResolvedValue(previousRecord)

		const result = await backfillAgentChatSessionMessages(history, user)

		expect(findPrevious).toHaveBeenCalledWith('a-1', user)
		expect(result[1]).toMatchObject({
			messageId: 'a-1',
			usedTools: [{ name: 'loadSkill', callCount: 1 }],
			usedSkills: [{ name: 'Guideline Curator', callCount: 1 }],
			aiUsage: { model: 'claude-sonnet-4-6', callCount: 2, totalTokens: 120 },
		})
		expect(result[1].usedTools?.[0]).not.toHaveProperty('id')
		expect(result[1].aiUsage).not.toHaveProperty('rawUsage')
	})

	it('text와 reaction은 클라이언트 현재값을 유지한다', async () => {
		findPrevious.mockResolvedValue(previousRecord)

		const result = await backfillAgentChatSessionMessages(history, user)

		expect(result[1].text).toBe('가이드라인입니다.')
		expect(result[1].reaction).toBe('good')
		expect(result[0]).toEqual(history[0])
		expect(result[2]).toEqual(history[2])
	})

	it('assistant 메시지가 없는 첫 턴은 조회 없이 입력을 그대로 반환한다', async () => {
		const firstTurn: AgentChatSessionMessageInput[] = [
			{ messageId: 'u-1', role: 'user', text: '안녕' },
		]

		const result = await backfillAgentChatSessionMessages(firstTurn, user)

		expect(result).toBe(firstTurn)
		expect(findPrevious).not.toHaveBeenCalled()
	})

	it('직전 레코드에 없는 messageId는 빈칸 그대로 둔다', async () => {
		findPrevious.mockResolvedValue({
			id: 21,
			messages: [],
		} as unknown as AgentChatSessionRecord)

		const result = await backfillAgentChatSessionMessages(history, user)

		expect(result[1]).toEqual(history[1])
	})

	it('조회가 실패해도 입력을 그대로 반환한다', async () => {
		findPrevious.mockRejectedValue(new Error('db down'))

		const result = await backfillAgentChatSessionMessages(history, user)

		expect(result).toEqual(history)
	})
})
