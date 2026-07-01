import { Streamdown } from 'streamdown'
import { Bubble, BubbleContent } from '@/components/ui/bubble'

export function AgentChatErrorBubble({ error }: { error: Error }) {
	return (
		<Bubble variant="destructive">
			<BubbleContent>{error.message}</BubbleContent>
		</Bubble>
	)
}

export function AgentChatUserBubble({ text }: { text: string }) {
	if (!text) {
		return null
	}

	return (
		<Bubble align="end" variant="default" className="rounded-full">
			<BubbleContent className="whitespace-pre-wrap">
				<p className="text-sm">{text}</p>
			</BubbleContent>
		</Bubble>
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
