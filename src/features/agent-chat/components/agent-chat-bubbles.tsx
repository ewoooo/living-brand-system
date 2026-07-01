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
		<div className="flex max-w-full flex-col items-end gap-2">
			<AgentChatFileAttachments files={files} />
			{text && (
				<Bubble align="end" variant="default" className="rounded-full">
					<BubbleContent className="whitespace-pre-wrap">
						<p className="text-sm">{text}</p>
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
			{files.map((file) => (
				<AgentChatFileAttachment key={file.url} file={file} />
			))}
		</AttachmentGroup>
	)
}

function AgentChatFileAttachment({ file }: { file: FileUIPart }) {
	const isImage = file.mediaType.startsWith('image')

	return (
		<Attachment size="sm">
			<AttachmentMedia variant={isImage ? 'image' : 'icon'}>
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
	text,
	isStreaming = false,
}: {
	text: string
	isStreaming?: boolean
}) {
	if (!text) {
		return null
	}

	return (
		<Bubble align="start" variant="muted" className="rounded-full">
			<BubbleContent>
				<Streamdown
					animated
					controls={false}
					isAnimating={isStreaming}
					className="space-y-2 text-sm [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4"
				>
					{text}
				</Streamdown>
			</BubbleContent>
		</Bubble>
	)
}
