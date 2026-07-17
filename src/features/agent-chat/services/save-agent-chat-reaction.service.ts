import {
	findOwnedAgentChatSessionMessages,
	saveAgentChatSessionReaction as saveAgentChatSessionReactionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import type { AgentChatReaction } from '@/features/agent-chat/types'
import type { AgentChatSession, User } from '@/payload-types'

export interface SaveAgentChatReactionInput {
	agentChatSessionId: AgentChatSession['id']
	messageId: string
	reaction: AgentChatReaction
	user: User
}

/**
 * 사용자가 소유한 Agent 답변 메시지의 리액션을 저장한다.
 * AgentChatSession 조회와 갱신 I/O는 agent-chat-session repository가 소유한다.
 */
export async function saveAgentChatReaction(input: SaveAgentChatReactionInput) {
	const session = await findOwnedAgentChatSessionMessages(input.agentChatSessionId, input.user)
	if (!session) return null

	const target = session.messages.find(({ messageId }) => messageId === input.messageId)
	if (target?.role !== 'assistant') return null

	const saved = await saveAgentChatSessionReactionRecord({
		id: session.id,
		messageId: target.messageId,
		reactedAt: new Date().toISOString(),
		reaction: input.reaction,
		user: input.user,
	})
	return saved ? { id: session.id } : null
}
