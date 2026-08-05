'use client'

import { ThumbsDown, ThumbsDownFilled, ThumbsUp, ThumbsUpFilled } from '@carbon/icons-react'
import { useState } from 'react'
import { BubbleReactions } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import type { AgentChatReaction } from '@/features/agent-chat/types'

/** 리액션 클릭을 세션 피드백 저장 API로 보낸다 — 이 컴포넌트가 유일한 호출자다. */
async function saveAgentChatReaction(input: {
	agentChatSessionId: number
	messageId: string
	reaction: AgentChatReaction
}) {
	const response = await fetch('/api/agent-chat/reaction', {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input),
	})

	if (!response.ok) {
		throw new Error('Reaction failed.')
	}
}

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
					className="rounded-sm px-2 py-0.5 font-body text-xs font-normal text-muted-foreground"
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
