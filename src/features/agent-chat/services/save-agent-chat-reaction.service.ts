import { updateAgentChatSessionReaction } from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
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
export function saveAgentChatReaction(input: SaveAgentChatReactionInput) {
	return updateAgentChatSessionReaction({
		id: input.agentChatSessionId,
		messageId: input.messageId,
		reaction: input.reaction,
		user: input.user,
	})
}
