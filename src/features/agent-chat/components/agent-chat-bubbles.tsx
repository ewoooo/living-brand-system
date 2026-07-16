import type { FileUIPart } from 'ai'
import { Streamdown } from 'streamdown'
import {
	Attachment,
	AttachmentContent,
	AttachmentDescription,
	AttachmentGroup,
	AttachmentMedia,
	AttachmentTitle,
} from '@/components/ui/attachment'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import type { AgentChatReaction } from '@/features/agent-chat/types'
import { AgentChatReactions } from './agent-chat-reactions'

export function AgentChatErrorBubble({ error }: { error: Error }) {
	return (
		<Bubble variant="destructive">
			<BubbleContent>{error.message}</BubbleContent>
		</Bubble>
	)
}

export function AgentChatUserBubble({ files, text }: { files: FileUIPart[]; text: string }) {
	if (!text && files.length === 0) {
		return null
	}

	return (
		<div className="flex w-full max-w-full flex-col items-end gap-2">
			<AgentChatFileAttachments files={files} />
			{text && (
				<Bubble align="end" variant="default" className="rounded-full">
					<BubbleContent
						asChild
						className="type-callout whitespace-pre-wrap [overflow-wrap:normal] [word-break:keep-all]"
					>
						<p>{text}</p>
					</BubbleContent>
				</Bubble>
			)}
		</div>
	)
}

function AgentChatFileAttachments({ files }: { files: FileUIPart[] }) {
	if (files.length === 0) {
		return null
	}

	return (
		<AttachmentGroup>
			{files.map((file, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: same data-URL image can repeat, so url alone collides.
				<AgentChatFileAttachment key={`${file.url}-${index}`} file={file} />
			))}
		</AttachmentGroup>
	)
}

function AgentChatFileAttachment({ file }: { file: FileUIPart }) {
	const isImage = file.mediaType.startsWith('image')

	return (
		<Attachment size="default" orientation="vertical" className="w-36 rounded-3xl p-2">
			<AttachmentMedia variant={isImage ? 'image' : 'icon'} className="rounded-2xl">
				{isImage ? (
					// biome-ignore lint/performance/noImgElement: AI SDK file parts can be data URLs.
					<img src={file.url} alt={file.filename || 'Attachment'} />
				) : (
					'TXT'
				)}
			</AttachmentMedia>
			<AttachmentContent>
				<AttachmentTitle>{file.filename || 'Attachment'}</AttachmentTitle>
				<AttachmentDescription>{file.mediaType}</AttachmentDescription>
			</AttachmentContent>
		</Attachment>
	)
}

export function AgentChatAgentBubble({
	agentChatMessageId,
	agentChatSessionId,
	canReact = false,
	initialReaction,
	text,
	isStreaming = false,
}: {
	agentChatMessageId?: string
	agentChatSessionId?: number
	canReact?: boolean
	initialReaction?: AgentChatReaction
	text: string
	isStreaming?: boolean
}) {
	if (!text) {
		return null
	}

	return (
		<Bubble
			align="start"
			variant="muted"
			className={canReact ? 'mt-2 rounded-full' : 'rounded-full'}
		>
			<BubbleContent className="px-4 py-4">
				<Streamdown
					animated
					controls={false}
					isAnimating={isStreaming}
					className="typeset typeset-lbs"
				>
					{text}
				</Streamdown>
			</BubbleContent>
			{canReact && agentChatSessionId && agentChatMessageId ? (
				<AgentChatReactions
					agentChatMessageId={agentChatMessageId}
					agentChatSessionId={agentChatSessionId}
					initialReaction={initialReaction}
				/>
			) : null}
		</Bubble>
	)
}
