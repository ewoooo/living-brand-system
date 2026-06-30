'use client'

import { Search } from '@carbon/icons-react'
import type { UIMessage } from 'ai'
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
import { getAgentToolMarkerText } from '@/features/agent-chat/agent-tool-marker'

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
	const markerText = isUser ? null : getAgentToolMarkerText(message)
	const messageText = getAgentMessageText(message)

	return (
		<div
			className={isUser ? 'flex flex-col items-end gap-2' : 'flex flex-col items-start gap-2'}
		>
			{markerText && (
				<Marker>
					<MarkerIcon>
						<Search />
					</MarkerIcon>
					<MarkerContent>{markerText}</MarkerContent>
				</Marker>
			)}
			{messageText && (
				<Bubble
					align={isUser ? 'end' : 'start'}
					variant={isUser ? 'default' : 'muted'}
					className="rounded-full"
				>
					<BubbleContent className="whitespace-pre-wrap">
						<p className="text-sm">{messageText}</p>
					</BubbleContent>
				</Bubble>
			)}
		</div>
	)
}

function getAgentMessageText(message: UIMessage) {
	return message.parts.reduce(
		(text, part) => (part.type === 'text' ? text + part.text : text),
		'',
	)
}
