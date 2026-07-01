import { getAgentToolMarker } from '@/features/agent-chat/get-agent-tool-marker'
import type { AgentChatMessage } from '@/features/agent-chat/services/create-agent-chat-response.service'
import { AgentChatAgentBubble, AgentChatUserBubble } from './agent-chat-bubbles'
import { AgentChatToolMarker } from './agent-chat-tool-marker'

export function AgentChatMessageItem({
	message,
	isActive,
}: {
	message: AgentChatMessage
	isActive: boolean
}) {
	const isUser = message.role === 'user'
	const marker = isUser ? null : getAgentToolMarker(message)
	const messageText = getAgentMessageText(message)
	const files = message.parts.filter((part) => part.type === 'file')

	return (
		<div
			className={isUser ? 'flex flex-col items-end gap-2' : 'flex flex-col items-start gap-2'}
		>
			<AgentChatToolMarker marker={marker} isPending={marker?.isPending || isActive} />
			{isUser ? (
				<AgentChatUserBubble text={messageText} files={files} />
			) : (
				<AgentChatAgentBubble text={messageText} isStreaming={isActive} />
			)}
		</div>
	)
}

function getAgentMessageText(message: AgentChatMessage) {
	return message.parts.reduce(
		(text, part) => (part.type === 'text' ? text + part.text : text),
		'',
	)
}
