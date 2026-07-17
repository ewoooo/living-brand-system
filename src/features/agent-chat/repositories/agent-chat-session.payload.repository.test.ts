import { getPayload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createAgentChatSessionRecord,
	findLatestAgentChatSessionMessagesContainingAny,
	findOwnedAgentChatSessionMessages,
	saveAgentChatSessionReaction,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import type { User } from '@/payload-types'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

const user = { id: 7 } as User

describe('agent-chat-session Payload repository', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('세션 생성 결과에서 Service가 쓰는 id만 반환한다', async () => {
		const create = vi.fn().mockResolvedValue({
			id: 41,
			status: 'running',
			createdAt: '2026-07-17T00:00:00.000Z',
		})
		vi.mocked(getPayload).mockResolvedValue({ create } as never)

		await expect(
			createAgentChatSessionRecord({
				status: 'running',
				messageCount: 1,
				messages: [{ messageId: 'u-1', role: 'user', text: '안녕' }],
				user,
			}),
		).resolves.toEqual({ id: 41 })
	})

	it('저장 메시지의 null과 Payload row 필드를 제거하고 백필 DTO로 변환한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					messages: [
						{
							id: 'message-row',
							messageId: 'a-1',
							role: 'assistant',
							text: null,
							usedTools: [{ id: 'tool-row', name: 'loadSkill', callCount: null }],
							usedSkills: null,
							aiUsage: {
								model: null,
								callCount: 2,
								inputTokens: null,
								outputTokens: 20,
								totalTokens: 20,
								cacheReadInputTokens: null,
								cacheWriteInputTokens: null,
								reasoningTokens: null,
								rawUsage: { provider: 'raw' },
							},
							reaction: null,
							reactedAt: null,
						},
					],
				},
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find, logger: { warn: vi.fn() } } as never)

		await expect(
			findLatestAgentChatSessionMessagesContainingAny(['a-1'], user),
		).resolves.toEqual([
			{
				messageId: 'a-1',
				role: 'assistant',
				usedTools: [{ name: 'loadSkill' }],
				aiUsage: { callCount: 2, outputTokens: 20, totalTokens: 20 },
			},
		])
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					and: [{ 'messages.messageId': { in: ['a-1'] } }, { createdBy: { equals: 7 } }],
				},
			}),
		)
	})

	it('백필 조회 실패를 기록하고 빈 DTO 목록으로 격리한다', async () => {
		const error = new Error('db down')
		const find = vi.fn().mockRejectedValue(error)
		const warn = vi.fn()
		vi.mocked(getPayload).mockResolvedValue({ find, logger: { warn } } as never)

		await expect(
			findLatestAgentChatSessionMessagesContainingAny(['a-1'], user),
		).resolves.toEqual([])
		expect(warn).toHaveBeenCalledWith(
			{ err: error, messageIds: ['a-1'] },
			'agent-chat.backfill-lookup.failed',
		)
	})

	it('리액션 대상 세션을 소유자로 제한해 DTO로 읽고 Service 결과만 저장한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					id: 41,
					messages: [
						{
							id: 'row-id',
							messageId: 'a-1',
							role: 'assistant',
							text: '답변',
							reaction: null,
							reactedAt: null,
						},
					],
				},
			],
		})
		const update = vi.fn().mockResolvedValue({ id: 41 })
		vi.mocked(getPayload).mockResolvedValue({ find, update } as never)

		await expect(findOwnedAgentChatSessionMessages(41, user)).resolves.toEqual({
			id: 41,
			messages: [{ messageId: 'a-1', role: 'assistant' }],
		})
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { and: [{ id: { equals: 41 } }, { createdBy: { equals: 7 } }] },
			}),
		)

		await expect(
			saveAgentChatSessionReaction({
				id: 41,
				messageId: 'a-1',
				reaction: 'good',
				reactedAt: '2026-07-17T00:00:00.000Z',
				user,
			}),
		).resolves.toBe(true)
		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 41,
				data: {
					messages: [
						{
							id: 'row-id',
							messageId: 'a-1',
							role: 'assistant',
							text: '답변',
							reaction: 'good',
							reactedAt: '2026-07-17T00:00:00.000Z',
						},
					],
				},
				user,
			}),
		)
	})
})
