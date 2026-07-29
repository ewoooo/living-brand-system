'use client'

import { usePathname } from 'next/navigation'
import { type DragEvent, useState } from 'react'
import { AgentChatMessageList } from '@/components/global/chat/agent-chat-message-list'
import { AgentChatUserInput } from '@/components/global/chat/agent-chat-user-input'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import { useAgentChat } from '@/features/agent-chat/hooks/use-agent-chat'
import { cn } from '@/lib/utils'

export function GlobalAgentChat() {
	const pagePath = usePathname()
	const [input, setInput] = useState('')
	const [files, setFiles] = useState<FileList>()
	const [isDraggingFile, setIsDraggingFile] = useState(false)
	const { messages, sendMessage, status, error } = useAgentChat()
	const isBusy = status === 'submitted' || status === 'streaming'
	const canDropFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files')

	function handleSubmit() {
		if (isBusy) return
		const text = input.trim()
		if (text) {
			sendMessage({ text, files }, { body: { pagePath } })
		} else if (files?.length) {
			sendMessage({ files }, { body: { pagePath } })
		} else {
			return
		}
		setInput('')
		setFiles(undefined)
	}

	return (
		<Sidebar
			side="right"
			collapsible="offcanvas"
			className={cn('border-border bg-card', isDraggingFile && 'ring-2 ring-primary/30')}
			onDragEnter={(event) => {
				if (isBusy || !canDropFiles(event)) return
				event.preventDefault()
				setIsDraggingFile(true)
			}}
			onDragOver={(event) => {
				if (isBusy || !canDropFiles(event)) return
				event.preventDefault()
				event.dataTransfer.dropEffect = 'copy'
				setIsDraggingFile(true)
			}}
			onDragLeave={(event) => {
				if (
					event.relatedTarget instanceof Node &&
					event.currentTarget.contains(event.relatedTarget)
				) {
					return
				}
				setIsDraggingFile(false)
			}}
			onDrop={(event) => {
				event.preventDefault()
				setIsDraggingFile(false)
				if (isBusy || event.dataTransfer.files.length === 0) return
				setFiles(event.dataTransfer.files)
			}}
		>
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
			<h2 className="font-body text-base font-bold">채팅</h2>
		</header>
	)
}
