import { findLatestAgentChatSessionContainingMessage } from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import type {
	AgentChatAiUsage,
	AgentChatSessionMessageInput,
	AgentChatSessionUsage,
} from '@/features/agent-chat/types'
import type { AgentChatSession as AgentChatSessionRecord, User } from '@/payload-types'

type AgentChatSessionRecordMessage = NonNullable<AgentChatSessionRecord['messages']>[number]

/**
 * 클라이언트 왕복으로 비는 히스토리 assistant 메시지의 실행 메타데이터(usedTools/usedSkills/aiUsage)를
 * 직전 세션 레코드에서 messageId 매칭으로 복사하는 유스케이스. 직전 레코드는 이미 백필된 합본이므로
 * 1건 조회로 충분하다. 조회 I/O와 실패 로깅은 agent-chat-session repository가 소유하고,
 * 여기서는 실패 시 입력을 그대로 반환한다(best-effort — 백필은 채팅의 전제조건이 아니다).
 */
export async function backfillAgentChatSessionMessages(
	messages: AgentChatSessionMessageInput[],
	user: User,
): Promise<AgentChatSessionMessageInput[]> {
	const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')

	if (!lastAssistant) {
		return messages
	}

	let previous: AgentChatSessionRecord | null = null

	try {
		previous = await findLatestAgentChatSessionContainingMessage(lastAssistant.messageId, user)
	} catch {
		// 조회 실패 로깅은 repository가 담당한다 — 여기서는 백필만 건너뛴다.
	}

	const sources = new Map(
		(previous?.messages ?? [])
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
		const metadata = source ? toMessageMetadata(source) : null

		return metadata ? { ...message, ...metadata } : message
	})
}

function toMessageMetadata(source: AgentChatSessionRecordMessage) {
	const usedTools = toUsage(source.usedTools)
	const usedSkills = toUsage(source.usedSkills)
	const aiUsage = toAiUsage(source.aiUsage)

	if (!usedTools && !usedSkills && !aiUsage) {
		return null
	}

	return {
		...(usedTools ? { usedTools } : {}),
		...(usedSkills ? { usedSkills } : {}),
		...(aiUsage ? { aiUsage } : {}),
	}
}

function toUsage(
	rows: AgentChatSessionRecordMessage['usedTools'],
): AgentChatSessionUsage[] | undefined {
	if (!rows?.length) {
		return undefined
	}

	return rows.map(({ name, callCount }) => ({ name, callCount: callCount ?? undefined }))
}

// ponytail: rawUsage는 원본 턴 레코드에만 남긴다 — 합본마다 복제하면 레코드가 턴 수만큼 비대해진다.
function toAiUsage(group: AgentChatSessionRecordMessage['aiUsage']): AgentChatAiUsage | undefined {
	if (group?.callCount == null) {
		return undefined
	}

	return {
		model: group.model ?? undefined,
		callCount: group.callCount,
		inputTokens: group.inputTokens ?? undefined,
		outputTokens: group.outputTokens ?? undefined,
		totalTokens: group.totalTokens ?? undefined,
		cacheReadInputTokens: group.cacheReadInputTokens ?? undefined,
		cacheWriteInputTokens: group.cacheWriteInputTokens ?? undefined,
		reasoningTokens: group.reasoningTokens ?? undefined,
	}
}
