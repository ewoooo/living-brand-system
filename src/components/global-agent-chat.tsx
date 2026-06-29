'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AgentChatInput } from '@/features/agent/components/agent-chat-input'
import { AgentMessageList } from '@/features/agent/components/agent-message-list'
import { useAgentChat } from '@/features/agent/hooks/use-agent-chat'

export function GlobalAgentChat() {
	const pagePath = usePathname()
	const [input, setInput] = useState('')
	const { messages, sendMessage, status, error } = useAgentChat()
	const isBusy = status === 'submitted' || status === 'streaming'

	return (
		<aside className="fixed top-14 right-0 bottom-0 hidden w-80 shrink-0 flex-col overflow-y-auto bg-background lg:flex">
			<GlobalAgentChatHeader />
			<AgentMessageList messages={messages} error={error} />
			<AgentChatInput
				value={input}
				isBusy={isBusy}
				onChange={setInput}
				onSubmit={() => {
					sendMessage({ text: input }, { body: { pagePath } })
					setInput('')
				}}
			/>
		</aside>
	)
}

function GlobalAgentChatHeader() {
	return (
		<header className="px-3 py-2">
			<h2 className="font-medium text-sm">Chat</h2>
		</header>
	)
}
