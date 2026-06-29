import type { UIMessage } from 'ai'

export function AgentMessageList({ messages, error }: { messages: UIMessage[]; error?: Error }) {
	const isEmpty = messages.length === 0 && !error

	if (isEmpty) {
		return (
			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				<AgentEmptyMessage />
			</div>
		)
	}

	return (
		<div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
			{messages.map((message) => (
				<AgentMessageBubble key={message.id} message={message} />
			))}
			{error && <AgentErrorBubble error={error} />}
		</div>
	)
}

function AgentEmptyMessage() {
	return <p className="text-muted-foreground text-sm">Ask about this guideline.</p>
}

function AgentErrorBubble({ error }: { error: Error }) {
	return (
		<div className="rounded-md bg-neutral-500/10 px-3 py-2 text-destructive text-sm">
			<p className="text-neutral-500">{error.message}</p>
		</div>
	)
}

function AgentMessageBubble({ message }: { message: UIMessage }) {
	return message.role === 'user' ? (
		<AgentUserMessageBubble message={message} />
	) : (
		<AgentAssistantMessageBubble message={message} />
	)
}

function AgentUserMessageBubble({ message }: { message: UIMessage }) {
	return (
		<div className="flex justify-start">
			<div className="max-w-[85%] rounded-md bg-primary px-3 py-2 text-primary-foreground">
				<AgentMessageText message={message} />
			</div>
		</div>
	)
}

function AgentAssistantMessageBubble({ message }: { message: UIMessage }) {
	return (
		<div className="flex justify-end">
			<div className="max-w-[85%] rounded-md bg-muted px-3 py-2">
				<AgentMessageText message={message} />
			</div>
		</div>
	)
}

function AgentMessageText({ message }: { message: UIMessage }) {
	return (
		<p className="text-sm">
			{message.parts
				.filter((part) => part.type === 'text')
				.map((part) => part.text)
				.join('')}
		</p>
	)
}
