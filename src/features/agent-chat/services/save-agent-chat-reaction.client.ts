import type { AgentChatReaction } from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'

/**
 * Agent 채팅 리액션 client service — UI 클릭을 세션 피드백 저장 API로 보낸다.
 */
export async function saveAgentChatReaction(input: {
	agentChatSessionId: number
	messageId: string
	reaction: AgentChatReaction
}) {
	const response = await fetch('/api/agent-chat/reaction', {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input),
	})

	if (!response.ok) {
		throw new Error('Reaction failed.')
	}
}
