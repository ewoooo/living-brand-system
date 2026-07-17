import { findLatestAgentChatSessionMessagesContainingAny } from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import type { AgentChatSessionMessageInput } from '@/features/agent-chat/types'
import type { User } from '@/payload-types'

/**
 * 클라이언트 왕복으로 비는 히스토리 assistant 메시지의 실행 메타데이터(usedTools/usedSkills/aiUsage)를
 * 직전 세션 메시지에서 messageId 매칭으로 복사하는 유스케이스. 조회 결과는 이미 백필된 합본이므로
 * 1건 조회로 충분하다. 미종결 턴으로 저장되지 않은 assistant가 있어도 나머지 messageId로 합본을 찾도록
 * 전체 assistant id로 조회한다. 조회 I/O와 실패 로깅은 agent-chat-session repository가 소유하고,
 * 여기서는 실패 시 입력을 그대로 반환한다(best-effort — 백필은 채팅의 전제조건이 아니다).
 */
export async function backfillAgentChatSessionMessages(
	messages: AgentChatSessionMessageInput[],
	user: User,
): Promise<AgentChatSessionMessageInput[]> {
	const assistantMessageIds = messages
		.filter((message) => message.role === 'assistant')
		.map((message) => message.messageId)

	if (assistantMessageIds.length === 0) {
		return messages
	}

	let previousMessages: AgentChatSessionMessageInput[] = []

	try {
		previousMessages = await findLatestAgentChatSessionMessagesContainingAny(
			assistantMessageIds,
			user,
		)
	} catch {
		// Repository 초기화까지 실패해도 best-effort 백필이 본 채팅을 막지 않는다.
	}

	const sources = new Map(
		previousMessages
			.filter((message) => message.role === 'assistant')
			.map((message) => [message.messageId, message]),
	)

	if (sources.size === 0) {
		return messages
	}

	return messages.map((message) => {
		if (
			message.role !== 'assistant' ||
			message.usedTools ||
			message.usedSkills ||
			message.aiUsage
		) {
			return message
		}

		const source = sources.get(message.messageId)
		if (!source || (!source.usedTools && !source.usedSkills && !source.aiUsage)) {
			return message
		}

		return {
			...message,
			...(source.usedTools ? { usedTools: source.usedTools } : {}),
			...(source.usedSkills ? { usedSkills: source.usedSkills } : {}),
			...(source.aiUsage ? { aiUsage: source.aiUsage } : {}),
		}
	})
}
