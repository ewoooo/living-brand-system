'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AgentChatInput } from '@/features/agent/components/agent-chat-input'
import { AgentMessageList } from '@/features/agent/components/agent-message-list'
import { useAgentChat } from '@/features/agent/hooks/use-agent-chat'

export function GuidelineAgentChat() {
	const pagePath = usePathname()
	const [input, setInput] = useState('')
	const { messages, sendMessage, status, error } = useAgentChat(pagePath)
	const isBusy = status === 'submitted' || status === 'streaming'

	return (
		<aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-80 shrink-0 flex-col overflow-y-auto bg-background lg:flex">
			<GuidelineAgentChatHeader />
			<AgentMessageList messages={messages} error={error} />
			<AgentChatInput
				value={input}
				isBusy={isBusy}
				onChange={setInput}
				onSubmit={() => {
					sendMessage({ text: input })
					setInput('')
				}}
			/>
		</aside>
	)
}

function GuidelineAgentChatHeader() {
	return (
		<header className="px-3 py-2">
			<h2 className="font-medium text-sm">Chat</h2>
		</header>
	)
}
