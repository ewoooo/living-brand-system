import config from '@payload-config'
import { getPayload } from 'payload'
import type { AgentChatSession } from '@/features/agent-chat/domain/agent-chat-session'
import type { AgentChatReaction, AgentChatSessionMessageInput } from '@/features/agent-chat/types'
import type { AgentChatSession as AgentChatSessionRecord, User } from '@/payload-types'

interface CreateAgentChatSessionInput {
	messages?: AgentChatSessionMessageInput[]
	messageCount?: number
	pagePath?: string
	status: AgentChatSessionRecord['status']
	user: User
}

interface UpdateAgentChatSessionReactionInput {
	id: AgentChatSessionRecord['id']
	messageId: string
	reaction: AgentChatReaction
	user: User
}

/**
 * AgentChatSession 저장 repository — 채팅 실행 기록의 Payload Local API 쓰기를 소유한다.
 */
export async function createAgentChatSessionRecord(input: CreateAgentChatSessionInput) {
	const payload = await getPayload({ config })

	return payload.create({
		collection: 'agent-chat-sessions',
		data: {
			status: input.status,
			pagePath: input.pagePath,
			messageCount: input.messageCount,
			messages: input.messages,
			createdBy: input.user.id,
		},
		overrideAccess: false,
		user: input.user,
	})
}

/**
 * AgentChatSession 조회 repository — messageId를 포함하는 본인 세션 최신 1건을 돌려준다.
 * 백필 소스 조회 전용이라 실패해도 throw하지 않고 warn 로깅 후 null을 반환한다(best-effort).
 */
export async function findLatestAgentChatSessionContainingMessage(
	messageId: string,
	user: User,
): Promise<AgentChatSessionRecord | null> {
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
					{ 'messages.messageId': { equals: messageId } },
					{ createdBy: { equals: user.id } },
				],
			},
		})

		return result.docs[0] ?? null
	} catch (error) {
		payload.logger.warn({ err: error, messageId }, 'agent-chat.backfill-lookup.failed')
		return null
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

/**
 * AgentChatSession 리액션 저장 repository — 소유 사용자의 피드백 메타데이터만 갱신한다.
 */
export async function updateAgentChatSessionReaction(input: UpdateAgentChatSessionReactionInput) {
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

	if (!session.docs[0]) return null

	const messages = session.docs[0].messages ?? []
	let targetFound = false
	const reactedAt = new Date().toISOString()
	const nextMessages = messages.map((message) => {
		if (message.messageId !== input.messageId || message.role !== 'assistant') {
			return message
		}

		targetFound = true
		return { ...message, reaction: input.reaction, reactedAt }
	})

	if (!targetFound) return null

	return payload.update({
		collection: 'agent-chat-sessions',
		id: session.docs[0].id,
		data: {
			messages: nextMessages,
		},
		overrideAccess: true,
		user: input.user,
	})
}
