import { Ai, Catalog, Search } from '@carbon/icons-react'
import Link from 'next/link'
import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import { Spinner } from '@/components/ui/spinner'
import {
	getAgentReasoningMarker,
	getAgentSkillMarker,
	getAgentToolMarker,
} from '@/features/agent-chat/utils/get-agent-tool-marker'
import { getAgentCitations } from '../utils/get-agent-citations'
import { getAgentMessageText } from '../utils/get-agent-message-text'
import { getAgentTemplateAttachments } from '../utils/get-agent-template-attachments'
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
	const citations = isUser ? [] : getAgentCitations(message)
	const messageText = getAgentMessageText(message)
	const files = message.parts.filter((part) => part.type === 'file')
	const templateAttachments = isUser ? [] : getAgentTemplateAttachments(message)

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
					{templateAttachments.map(({ attachment, key }) => (
						<AgentChatTemplateAttachment key={key} attachment={attachment} />
					))}
					<AgentChatAgentBubble text={messageText} isStreaming={isActive} />
					{citations.length > 0 && (
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-neutral-500 text-xs">
							<span>출처</span>
							{citations.map((citation) =>
								citation.href ? (
									<Link
										key={citation.key}
										href={citation.href}
										className="underline underline-offset-2 hover:text-neutral-700"
									>
										{citation.title}
									</Link>
								) : (
									<span key={citation.key}>{citation.title}</span>
								),
							)}
						</div>
					)}
				</>
			)}
		</div>
	)
}
