import type { AgentChatMessage } from '../services/create-agent-chat-response.service'

export function getAgentMessageText(message: AgentChatMessage) {
	return message.parts.reduce(
		(text, part) => (part.type === 'text' ? text + part.text : text),
		'',
	)
}
