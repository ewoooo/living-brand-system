import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import type { AgentChatMessage } from '@/features/agent-chat/services/create-agent-chat-response.service'
import { AgentChatErrorBubble } from './agent-chat-bubbles'
import { AgentChatMessageItem } from './agent-chat-message-item'

export function AgentChatMessageList({
	messages,
	error,
	isBusy = false,
}: {
	messages: AgentChatMessage[]
	error?: Error
	isBusy?: boolean
}) {
	const isEmpty = messages.length === 0 && !error
	const activeMessageId = isBusy ? messages.at(-1)?.id : undefined

	return (
		<MessageScrollerProvider>
			<MessageScroller className="min-h-0 flex-1">
				<MessageScrollerViewport className="scrollbar-none">
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
									<AgentChatMessageItem
										message={message}
										isActive={message.id === activeMessageId}
									/>
								</MessageScrollerItem>
							))
						)}
						{error && (
							<MessageScrollerItem>
								<AgentChatErrorBubble error={error} />
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
	return <p className="text-muted-foreground text-sm px-3">Ask about this guideline.</p>
}
