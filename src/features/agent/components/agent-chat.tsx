'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AgentChatInput } from '@/features/agent/components/agent-chat-input'
import { AgentMessageList } from '@/features/agent/components/agent-message-list'
import { useAgentChat } from '@/features/agent/hooks/use-agent-chat'

export function AgentChat() {
	const pagePath = usePathname()
	const [input, setInput] = useState('')
	const { messages, sendMessage, status, error } = useAgentChat(pagePath)
	const isBusy = status === 'submitted' || status === 'streaming'

	return (
		<aside className="hidden w-80 shrink-0 flex-col bg-background lg:flex">
			<AgentChatHeader />
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

function AgentChatHeader() {
	return (
		<header className="px-3 py-2">
			<h2 className="font-medium text-sm">Ask</h2>
		</header>
	)
}
