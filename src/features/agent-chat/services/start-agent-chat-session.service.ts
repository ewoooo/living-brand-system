import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import { AgentChatSession } from '@/features/agent-chat/domain/agent-chat-session'
import {
	createAgentChatSessionRecord,
	saveAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import type { AgentChatSessionUsageStep } from '@/features/agent-chat/services/collect-agent-chat-session-usage.service'
import type { AgentChatSessionMessageInput } from '@/features/agent-chat/types'
import { getAgentMessageText } from '@/features/agent-chat/utils/get-agent-message-parts'
import type { User } from '@/payload-types'

export interface StartAgentChatSessionInput {
	messages: AgentChatMessage[]
	pagePath?: string
	user: User
}

/**
 * Agent 채팅 세션을 시작하고 스트림 실행 기록을 저장하는 유스케이스.
 * 전이와 스텝 누적은 AgentChatSession Aggregate가 소유하며, DB 쓰기는 생성 1회와
 * 종결(completed/failed) 후 1회만 일어난다. 저장 I/O는 agent-chat-session repository가 소유한다.
 * 종결 후 recordStep/fail 호출은 no-op이다 — 완료된 세션을 뒤집는 레이스를 막는다.
 */
export async function startAgentChatSession(input: StartAgentChatSessionInput) {
	const assistantMessageId = crypto.randomUUID()
	const requestMessages = toSessionMessages(input.messages)
	const record = await createAgentChatSessionRecord({
		status: 'running',
		pagePath: input.pagePath,
		messageCount: requestMessages.length,
		messages: requestMessages,
		user: input.user,
	})
	const session = AgentChatSession.start({
		id: record.id,
		assistantMessageId,
		requestMessages,
	})

	return {
		assistantMessageId,
		id: session.id,
		fail: async (errorMessage: string) => {
			if (session.isTerminal) return
			session.fail(errorMessage)
			await saveAgentChatSessionRecord(session, input.user)
		},
		recordStep: async ({
			step,
			text,
			status,
		}: {
			step: AgentChatSessionUsageStep
			text?: string
			status: 'completed' | 'running'
		}) => {
			if (session.isTerminal) return
			session.recordStep({ step, text })
			if (status !== 'completed') return
			session.complete()
			await saveAgentChatSessionRecord(session, input.user)
		},
	}
}

function toSessionMessages(messages: AgentChatMessage[]): AgentChatSessionMessageInput[] {
	return messages.map((message) => ({
		messageId: message.metadata?.agentChatMessageId ?? message.id,
		role: message.role,
		text: getAgentMessageText(message),
		reaction: message.metadata?.reaction,
	}))
}
