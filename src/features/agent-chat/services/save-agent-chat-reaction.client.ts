/**
 * Agent 채팅 리액션 브라우저 fetch — POST /api/agent-chat/reaction 호출을 소유한다.
 * 리액션 저장 I/O는 서버측 save-agent-chat-reaction service가 담당하고,
 * 화면 상태(선택 반영·실패 롤백)는 호출자(AgentChatReactions)가 담당한다.
 */

import type { AgentChatReaction } from '@/features/agent-chat/types'

export interface SubmitAgentChatReactionInput {
	agentChatSessionId: number
	messageId: string
	reaction: AgentChatReaction
}

/** 채팅 답변 메시지에 대한 사용자 리액션을 세션 피드백 저장 API로 전송한다. */
export async function submitAgentChatReaction(input: SubmitAgentChatReactionInput): Promise<void> {
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
