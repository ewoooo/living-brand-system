import type { AgentChatMessage } from '@/agents/agent-chat.agent'

export function getAgentMessageText(message: AgentChatMessage) {
	return message.parts.reduce(
		(text, part) => (part.type === 'text' ? text + part.text : text),
		'',
	)
}
