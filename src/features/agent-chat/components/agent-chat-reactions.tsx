'use client'

import { ThumbsDown, ThumbsDownFilled, ThumbsUp, ThumbsUpFilled } from '@carbon/icons-react'
import { useState } from 'react'
import { BubbleReactions } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { saveAgentChatReaction } from '@/features/agent-chat/services/save-agent-chat-reaction.client'
import type { AgentChatReaction } from '@/features/agent-chat/types'

const reactionText: Record<AgentChatReaction, string> = {
	good: 'Good',
	bad: 'Bad',
}

const reactionIcons = {
	good: ThumbsUpFilled,
	bad: ThumbsDownFilled,
} satisfies Record<AgentChatReaction, typeof ThumbsUpFilled>

export function AgentChatReactions({
	agentChatMessageId,
	agentChatSessionId,
	initialReaction,
}: {
	agentChatMessageId: string
	agentChatSessionId: number
	initialReaction?: AgentChatReaction
}) {
	const [reaction, setReaction] = useState<AgentChatReaction | undefined>(initialReaction)
	const [isSaving, setIsSaving] = useState(false)

	if (reaction) {
		const Icon = reactionIcons[reaction]

		return (
			<BubbleReactions side="top" align="end">
				<span
					role="img"
					aria-label={`Reaction: ${reactionText[reaction]}`}
					className="type-caption-1 rounded-sm px-2 py-0.5 text-muted-foreground"
				>
					<Icon />
				</span>
			</BubbleReactions>
		)
	}

	function selectReaction(nextReaction: AgentChatReaction) {
		setReaction(nextReaction)
		setIsSaving(true)
		void saveAgentChatReaction({
			agentChatSessionId,
			messageId: agentChatMessageId,
			reaction: nextReaction,
		})
			.catch(() => setReaction(undefined))
			.finally(() => setIsSaving(false))
	}

	return (
		<BubbleReactions side="top" align="end">
			<Button
				type="button"
				variant="ghost"
				size="xs"
				aria-label="Good"
				disabled={isSaving}
				onClick={() => selectReaction('good')}
			>
				<ThumbsUp />
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="xs"
				aria-label="Bad"
				disabled={isSaving}
				onClick={() => selectReaction('bad')}
			>
				<ThumbsDown />
			</Button>
		</BubbleReactions>
	)
}
