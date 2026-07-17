import config from '@payload-config'
import { getPayload } from 'payload'
import type {
	AgentChatSession,
	AgentChatSessionStatus,
} from '@/features/agent-chat/domain/agent-chat-session'
import type {
	AgentChatAiUsage,
	AgentChatReaction,
	AgentChatSessionMessageInput,
	AgentChatSessionUsage,
} from '@/features/agent-chat/types'
import type { AgentChatSession as AgentChatSessionRecord, User } from '@/payload-types'

type AgentChatSessionRecordMessage = NonNullable<AgentChatSessionRecord['messages']>[number]

interface CreateAgentChatSessionInput {
	messages?: AgentChatSessionMessageInput[]
	messageCount?: number
	pagePath?: string
	status: AgentChatSessionStatus
	user: User
}

/**
 * AgentChatSession 저장 repository — 채팅 실행 기록의 Payload Local API 쓰기를 소유한다.
 */
export async function createAgentChatSessionRecord(
	input: CreateAgentChatSessionInput,
): Promise<{ id: number }> {
	const payload = await getPayload({ config })

	const record = await payload.create({
		collection: 'agent-chat-sessions',
		data: {
			status: input.status,
			pagePath: input.pagePath,
			messageCount: input.messageCount,
			messages: input.messages,
			createdBy: input.user.id,
		},
		// 서버 use case가 상태와 createdBy를 고정한 trusted write다.
		overrideAccess: true,
		user: input.user,
	})

	return { id: record.id }
}

/**
 * AgentChatSession 조회 repository — messageId들 중 하나라도 포함하는 본인 최신 세션의 메시지를
 * 영속성 독립 입력으로 변환한다. 실패해도 throw하지 않고 warn 로깅 후 빈 배열을 반환한다(best-effort).
 */
export async function findLatestAgentChatSessionMessagesContainingAny(
	messageIds: string[],
	user: User,
): Promise<AgentChatSessionMessageInput[]> {
	const payload = await getPayload({ config })

	try {
		// read 접근이 managerOrAdmin이라 사용자 컨텍스트로는 본인 기록도 못 읽는다.
		// updateAgentChatSessionReaction과 동일하게 overrideAccess + createdBy 필터로 본인 세션만 한정한다.
		const result = await payload.find({
			collection: 'agent-chat-sessions',
			depth: 0,
			limit: 1,
			sort: '-createdAt',
			overrideAccess: true,
			user,
			where: {
				and: [
					{ 'messages.messageId': { in: messageIds } },
					{ createdBy: { equals: user.id } },
				],
			},
		})

		return (result.docs[0]?.messages ?? []).map(toAgentChatSessionMessageInput)
	} catch (error) {
		payload.logger.warn({ err: error, messageIds }, 'agent-chat.backfill-lookup.failed')
		return []
	}
}

function toAgentChatSessionMessageInput(
	message: AgentChatSessionRecordMessage,
): AgentChatSessionMessageInput {
	const usedTools = toSessionUsage(message.usedTools)
	const usedSkills = toSessionUsage(message.usedSkills)
	const aiUsage = toAiUsage(message.aiUsage)

	return {
		messageId: message.messageId,
		role: message.role,
		...(message.text != null ? { text: message.text } : {}),
		...(usedTools ? { usedTools } : {}),
		...(usedSkills ? { usedSkills } : {}),
		...(aiUsage ? { aiUsage } : {}),
		...(message.reaction != null ? { reaction: message.reaction } : {}),
		...(message.reactedAt != null ? { reactedAt: message.reactedAt } : {}),
	}
}

function toSessionUsage(
	rows: AgentChatSessionRecordMessage['usedTools'],
): AgentChatSessionUsage[] | undefined {
	if (!rows?.length) return undefined

	return rows.map(({ name, callCount }) => ({
		name,
		...(callCount != null ? { callCount } : {}),
	}))
}

// ponytail: rawUsage는 원본 턴 레코드에만 남긴다 — 합본마다 복제하면 레코드가 턴 수만큼 비대해진다.
function toAiUsage(group: AgentChatSessionRecordMessage['aiUsage']): AgentChatAiUsage | undefined {
	if (group?.callCount == null) return undefined

	return {
		...(group.model != null ? { model: group.model } : {}),
		callCount: group.callCount,
		...(group.inputTokens != null ? { inputTokens: group.inputTokens } : {}),
		...(group.outputTokens != null ? { outputTokens: group.outputTokens } : {}),
		...(group.totalTokens != null ? { totalTokens: group.totalTokens } : {}),
		...(group.cacheReadInputTokens != null
			? { cacheReadInputTokens: group.cacheReadInputTokens }
			: {}),
		...(group.cacheWriteInputTokens != null
			? { cacheWriteInputTokens: group.cacheWriteInputTokens }
			: {}),
		...(group.reasoningTokens != null ? { reasoningTokens: group.reasoningTokens } : {}),
	}
}

/**
 * AgentChatSession 저장 repository — Aggregate의 종결 시점 상태를 기록한다.
 * 저장 필드 선택은 Aggregate의 toUpdateData()가 소유한다.
 */
export async function saveAgentChatSessionRecord(
	session: AgentChatSession,
	user: User,
): Promise<void> {
	const payload = await getPayload({ config })
	await payload.update({
		collection: 'agent-chat-sessions',
		id: session.id,
		data: session.toUpdateData(),
		overrideAccess: true,
		user,
	})
}

/** 리액션 Use Case용 본인 세션을 조회해 Payload 메시지를 plain DTO로 변환한다. */
export async function findOwnedAgentChatSessionMessages(
	id: number,
	user: User,
): Promise<{
	id: number
	messages: { messageId: string; role: AgentChatSessionMessageInput['role'] }[]
} | null> {
	const payload = await getPayload({ config })
	const session = await payload.find({
		collection: 'agent-chat-sessions',
		depth: 0,
		limit: 1,
		overrideAccess: true,
		user,
		where: {
			and: [{ id: { equals: id } }, { createdBy: { equals: user.id } }],
		},
	})
	const record = session.docs[0]

	return record
		? {
				id: record.id,
				messages: (record.messages ?? []).map(({ messageId, role }) => ({
					messageId,
					role,
				})),
			}
		: null
}

/** Service가 승인한 리액션 patch를 raw Payload row ID를 보존하며 저장한다. */
export async function saveAgentChatSessionReaction(input: {
	id: number
	messageId: string
	reactedAt: string
	reaction: AgentChatReaction
	user: User
}): Promise<boolean> {
	const payload = await getPayload({ config })
	const session = await payload.find({
		collection: 'agent-chat-sessions',
		depth: 0,
		limit: 1,
		overrideAccess: true,
		user: input.user,
		where: {
			and: [{ id: { equals: input.id } }, { createdBy: { equals: input.user.id } }],
		},
	})
	const record = session.docs[0]
	if (!record) return false

	let targetFound = false
	const messages = (record.messages ?? []).map((message) => {
		if (message.messageId !== input.messageId) return message
		targetFound = true
		return { ...message, reaction: input.reaction, reactedAt: input.reactedAt }
	})
	if (!targetFound) return false

	await payload.update({
		collection: 'agent-chat-sessions',
		id: record.id,
		data: { messages },
		overrideAccess: true,
		user: input.user,
	})
	return true
}
