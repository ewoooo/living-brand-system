import { Ai, Catalog, Search } from '@carbon/icons-react'
import { Spinner } from '@/components/ui/spinner'
import type { AgentChatMessage } from '@/features/agent-chat/services/create-agent-chat-response.service'
import {
	getAgentReasoningMarker,
	getAgentSkillMarker,
	getAgentToolMarker,
} from '@/features/agent-chat/utils/get-agent-tool-marker'
import type { AgentTemplateImageAttachment } from '../services/get-agent-tools.service'
import { getAgentMessageText } from '../utils/get-agent-message-text'
import { AgentChatAgentBubble, AgentChatUserBubble } from './agent-chat-bubbles'
import { AgentChatTemplateAttachment } from './agent-chat-template-attachment'
import { AgentChatMarker } from './agent-chat-tool-marker'

export function AgentChatMessageItem({
	message,
	isActive,
}: {
	message: AgentChatMessage
	isActive: boolean
}) {
	const isUser = message.role === 'user'
	const reasoningMarker = isUser ? null : getAgentReasoningMarker(message, isActive)
	const skillMarker = isUser ? null : getAgentSkillMarker(message)
	const marker = isUser ? null : getAgentToolMarker(message)
	const messageText = getAgentMessageText(message)
	const files = message.parts.filter((part) => part.type === 'file')
	const templateAttachments = isUser
		? []
		: message.parts.flatMap((part) => {
				if (
					part.type !== 'tool-prepareTemplateImage' ||
					part.state !== 'output-available' ||
					!('output' in part)
				) {
					return []
				}

				const output = (part as { output: AgentTemplateImageAttachment }).output
				return output.type === 'template-image' ? [output] : []
			})

	return (
		<div
			className={
				isUser
					? 'flex w-full flex-col items-end gap-2'
					: 'flex w-full flex-col items-start gap-2'
			}
		>
			<AgentChatMarker
				marker={reasoningMarker}
				icon={reasoningMarker?.isPending ? <Spinner /> : <Ai />}
			/>
			<AgentChatMarker marker={skillMarker} icon={<Catalog />} />
			<AgentChatMarker
				marker={marker}
				icon={<Search />}
				isPending={marker?.isPending || isActive}
			/>
			{isUser ? (
				<AgentChatUserBubble text={messageText} files={files} />
			) : (
				<>
					{templateAttachments.map((attachment) => (
						<AgentChatTemplateAttachment
							key={`${attachment.templateId}-${attachment.name}`}
							attachment={attachment}
						/>
					))}
					<AgentChatAgentBubble text={messageText} isStreaming={isActive} />
				</>
			)}
		</div>
	)
}
