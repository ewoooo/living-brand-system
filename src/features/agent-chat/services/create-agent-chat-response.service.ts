import { createAgentUIStreamResponse, safeValidateUIMessages } from 'ai'
import { type AgentChatMessage, agentChatAgent } from '@/agents/agent-chat.agent'

export type { AgentChatMessage }

/**
 * Route Handler가 받은 UI message가 현재 agent tool schema와 맞는지 검증한다.
 * 실제 tool 실행 I/O는 포함하지 않는다.
 */
export function validateAgentChatMessages(messages: unknown) {
	return safeValidateUIMessages<AgentChatMessage>({
		messages,
		// ponytail: UI messages never carry tool context; this mirrors AI SDK's harness cast.
		tools: agentChatAgent.tools as never,
	})
}

/**
 * Route Handler가 검증한 메시지를 AI SDK agent stream으로 변환한다.
 * Payload와 provider I/O는 agent-chat agent가 prepareCall과 tool 실행 시점에 맡는다.
 */
export function createAgentChatResponse(input: {
	locale?: 'ko' | 'en'
	messages: AgentChatMessage[]
	pagePath?: string
	requestId: string
	user: unknown
}) {
	return createAgentUIStreamResponse({
		agent: agentChatAgent,
		uiMessages: input.messages,
		options: {
			locale: input.locale,
			pagePath: input.pagePath,
			requestId: input.requestId,
			user: input.user,
		},
		onError: () => 'Agent response failed.',
	})
}
