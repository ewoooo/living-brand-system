'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { AgentChatMessageList } from '@/features/agent-chat/components/agent-chat-message-list'
import { AgentChatUserInput } from '@/features/agent-chat/components/agent-chat-user-input'
import { useAgentChat } from '@/features/agent-chat/hooks/use-agent-chat'

export function GlobalAgentChat() {
	const pagePath = usePathname()
	const [input, setInput] = useState('')
	const [files, setFiles] = useState<FileList>()
	const { messages, sendMessage, status, error } = useAgentChat()
	const isBusy = status === 'submitted' || status === 'streaming'

	function handleSubmit() {
		if (isBusy) return
		sendMessage(input.trim() ? { text: input, files } : { files: files as FileList }, {
			body: { pagePath },
		})
		setInput('')
		setFiles(undefined)
	}

	return (
		<Sidebar side="right" collapsible="offcanvas">
			<SidebarHeader>
				<GlobalAgentChatHeader />
			</SidebarHeader>
			<SidebarContent>
				<AgentChatMessageList messages={messages} error={error} isBusy={isBusy} />
			</SidebarContent>
			<SidebarFooter>
				<AgentChatUserInput
					files={files}
					value={input}
					isBusy={isBusy}
					onChange={setInput}
					onFilesChange={setFiles}
					onSubmit={handleSubmit}
				/>
			</SidebarFooter>
		</Sidebar>
	)
}

function GlobalAgentChatHeader() {
	return (
		<header className="p-3.5">
			<h2 className="font-medium text-sm">Chat</h2>
		</header>
	)
}
