import config from '@payload-config'
import { getPayload } from 'payload'
import { AgentChatSession } from '@/features/agent-chat/domain/agent-chat-session'
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
