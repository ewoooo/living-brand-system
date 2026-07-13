import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import {
	createAgentChatSessionRecord,
	updateAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import {
	type AgentChatSessionUsageSnapshot,
	type AgentChatSessionUsageStep,
	createAgentChatSessionUsageCollector,
} from '@/features/agent-chat/services/collect-agent-chat-session-usage.service'
import type { AgentChatSessionMessageInput } from '@/features/agent-chat/types'
import { getAgentMessageText } from '@/features/agent-chat/utils/get-agent-message-text'
import type { AgentChatSession, User } from '@/payload-types'

export interface StartAgentChatSessionInput {
	messages: AgentChatMessage[]
	pagePath?: string
	user: User
}

/**
 * Agent 채팅 세션을 시작하고 스트림 단계별 실행 기록을 저장한다.
 * AgentChatSession 생성과 갱신 I/O는 agent-chat-session repository가 소유한다.
 */
export async function startAgentChatSession(input: StartAgentChatSessionInput) {
	const assistantMessageId = crypto.randomUUID()
	const requestMessages = toSessionMessages(input.messages)
	const session = await createAgentChatSessionRecord({
		status: 'running',
		pagePath: input.pagePath,
		messageCount: requestMessages.length,
		messages: requestMessages,
		user: input.user,
	})
	const usageCollector = createAgentChatSessionUsageCollector()
	let assistantText = ''

	async function update(status: AgentChatSession['status'], errorMessage?: string) {
		const usage = usageCollector.snapshot()
		const messages = toMessagesWithAssistant({
			assistantMessageId,
			assistantText,
			requestMessages,
			usage,
		})

		await updateAgentChatSessionRecord({
			id: session.id,
			status,
			messageCount: messages.length,
			messages,
			usedTools: usage.usedTools,
			usedSkills: usage.usedSkills,
			aiUsage: usage.aiUsage,
			errorMessage,
			user: input.user,
		})
	}

	return {
		assistantMessageId,
		id: session.id,
		fail: (errorMessage: string) => update('failed', errorMessage),
		recordStep: async ({
			step,
			text,
			status,
		}: {
			step: AgentChatSessionUsageStep
			text?: string
			status: 'completed' | 'running'
		}) => {
			if (text) assistantText = text
			usageCollector.addStep(step)
			await update(status)
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

function toMessagesWithAssistant(input: {
	assistantMessageId: string
	assistantText: string
	requestMessages: AgentChatSessionMessageInput[]
	usage: AgentChatSessionUsageSnapshot
}): AgentChatSessionMessageInput[] {
	if (
		!input.assistantText &&
		!input.usage.aiUsage &&
		input.usage.usedTools.length === 0 &&
		input.usage.usedSkills.length === 0
	) {
		return input.requestMessages
	}

	return [
		...input.requestMessages,
		{
			messageId: input.assistantMessageId,
			role: 'assistant',
			text: input.assistantText,
			usedTools: input.usage.usedTools,
			usedSkills: input.usage.usedSkills,
			aiUsage: input.usage.aiUsage,
		},
	]
}
