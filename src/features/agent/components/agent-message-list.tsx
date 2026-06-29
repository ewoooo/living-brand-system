'use client'

import type { UIMessage } from 'ai'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from '@/components/ui/message-scroller'

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

	return (
		<Bubble
			align={isUser ? 'end' : 'start'}
			variant={isUser ? 'default' : 'muted'}
			className="rounded-full"
		>
			<BubbleContent className="whitespace-pre-wrap">
				<AgentMessageText message={message} />
			</BubbleContent>
		</Bubble>
	)
}

function AgentMessageText({ message }: { message: UIMessage }) {
	return (
		<p className="text-sm">
			{message.parts.reduce(
				(text, part) => (part.type === 'text' ? text + part.text : text),
				'',
			)}
		</p>
	)
}
