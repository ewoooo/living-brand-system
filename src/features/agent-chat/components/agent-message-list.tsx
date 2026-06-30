'use client'

import { Search } from '@carbon/icons-react'
import type { UIMessage } from 'ai'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { type AgentToolMarker, getAgentToolMarker } from '@/features/agent-chat/agent-tool-marker'

export function AgentMessageList({ messages, error }: { messages: UIMessage[]; error?: Error }) {
	const isEmpty = messages.length === 0 && !error

	return (
		<MessageScrollerProvider>
			<MessageScroller className="min-h-0 flex-1">
				<MessageScrollerViewport>
					<MessageScrollerContent className="gap-3 p-3">
						{isEmpty ? (
							<MessageScrollerItem>
								<AgentEmptyMessage />
							</MessageScrollerItem>
						) : (
							messages.map((message) => (
								<MessageScrollerItem
									key={message.id}
									className="flex flex-col"
									messageId={message.id}
									scrollAnchor={message.role === 'user'}
								>
									<AgentMessageBubble message={message} />
								</MessageScrollerItem>
							))
						)}
						{error && (
							<MessageScrollerItem>
								<AgentErrorBubble error={error} />
							</MessageScrollerItem>
						)}
					</MessageScrollerContent>
				</MessageScrollerViewport>
				<MessageScrollerButton />
			</MessageScroller>
		</MessageScrollerProvider>
	)
}

function AgentEmptyMessage() {
	return <p className="text-muted-foreground text-sm">Ask about this guideline.</p>
}

function AgentErrorBubble({ error }: { error: Error }) {
	return (
		<Bubble variant="destructive">
			<BubbleContent>{error.message}</BubbleContent>
		</Bubble>
	)
}

function AgentMessageBubble({ message }: { message: UIMessage }) {
	const isUser = message.role === 'user'
	const marker = isUser ? null : getAgentToolMarker(message)
	const messageText = getAgentMessageText(message)

	return (
		<div
			className={isUser ? 'flex flex-col items-end gap-2' : 'flex flex-col items-start gap-2'}
		>
			<AgentToolMarkerView marker={marker} />
			<AgentTextBubble isUser={isUser} text={messageText} />
		</div>
	)
}

function AgentToolMarkerView({ marker }: { marker: AgentToolMarker | null }) {
	if (!marker) {
		return null
	}

	return (
		<Marker>
			<MarkerIcon>
				<Search />
			</MarkerIcon>
			<MarkerContent className={marker.isPending ? 'shimmer' : undefined}>
				{marker.text}
			</MarkerContent>
		</Marker>
	)
}

function AgentTextBubble({ isUser, text }: { isUser: boolean; text: string }) {
	if (!text) {
		return null
	}

	return (
		<Bubble
			align={isUser ? 'end' : 'start'}
			variant={isUser ? 'default' : 'muted'}
			className="rounded-full"
		>
			<BubbleContent className={isUser ? 'whitespace-pre-wrap' : undefined}>
				{isUser ? (
					<p className="text-sm">{text}</p>
				) : (
					<div className="space-y-2 text-sm [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4">
						<Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
					</div>
				)}
			</BubbleContent>
		</Bubble>
	)
}

function getAgentMessageText(message: UIMessage) {
	return message.parts.reduce(
		(text, part) => (part.type === 'text' ? text + part.text : text),
		'',
	)
}
