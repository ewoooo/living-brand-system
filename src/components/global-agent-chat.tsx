'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AgentChatMessageList } from '@/features/agent-chat/components/agent-chat-message-list'
import { AgentChatUserInput } from '@/features/agent-chat/components/agent-chat-user-input'
import { useAgentChat } from '@/features/agent-chat/hooks/use-agent-chat'

export function GlobalAgentChat() {
	const pagePath = usePathname()
	const [input, setInput] = useState('')
	const { messages, sendMessage, status, error } = useAgentChat()
	const isBusy = status === 'submitted' || status === 'streaming'

	return (
		<aside className="fixed top-14 right-0 bottom-0 hidden w-80 shrink-0 flex-col overflow-y-auto bg-background lg:flex">
			<GlobalAgentChatHeader />
			<AgentChatMessageList messages={messages} error={error} isBusy={isBusy} />
			<AgentChatUserInput
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
