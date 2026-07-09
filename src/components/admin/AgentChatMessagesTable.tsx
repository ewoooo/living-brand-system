'use client'

import { useFormFields } from '@payloadcms/ui'
import type { FormState } from 'payload'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

type CountedItem = {
	callCount?: number | null
	name?: string | null
}

type MessageRow = {
	aiUsage?: {
		inputTokens?: number | null
		model?: string | null
		outputTokens?: number | null
		totalTokens?: number | null
	} | null
	messageId?: string | null
	reaction?: 'good' | 'bad' | null
	role?: string | null
	text?: string | null
	usedSkills?: CountedItem[] | null
	usedTools?: CountedItem[] | null
}

function fieldValue<T>(fields: FormState, path: string) {
	return fields[path]?.value as T | undefined
}

function fieldString(fields: FormState, path: string) {
	const value = fieldValue<unknown>(fields, path)

	return typeof value === 'string' ? value : null
}

function fieldNumber(fields: FormState, path: string) {
	const value = fieldValue<unknown>(fields, path)

	return typeof value === 'number' ? value : null
}

function fieldRowCount(fields: FormState, path: string) {
	return fields[path]?.rows?.length ?? fieldNumber(fields, path) ?? 0
}

function buildCountedItems(fields: FormState, path: string): CountedItem[] {
	return Array.from({ length: fieldRowCount(fields, path) }, (_, index) => ({
		callCount: fieldNumber(fields, `${path}.${index}.callCount`),
		name: fieldString(fields, `${path}.${index}.name`),
	}))
}

function buildMessages(fields: FormState): MessageRow[] {
	return Array.from({ length: fieldRowCount(fields, 'messages') }, (_, index) => {
		const path = `messages.${index}`

		return {
			aiUsage: {
				inputTokens: fieldNumber(fields, `${path}.aiUsage.inputTokens`),
				model: fieldString(fields, `${path}.aiUsage.model`),
				outputTokens: fieldNumber(fields, `${path}.aiUsage.outputTokens`),
				totalTokens: fieldNumber(fields, `${path}.aiUsage.totalTokens`),
			},
			messageId: fieldString(fields, `${path}.messageId`),
			reaction: fieldString(fields, `${path}.reaction`) as MessageRow['reaction'],
			role: fieldString(fields, `${path}.role`),
			text: fieldString(fields, `${path}.text`),
			usedSkills: buildCountedItems(fields, `${path}.usedSkills`),
			usedTools: buildCountedItems(fields, `${path}.usedTools`),
		}
	})
}

function formatItems(items?: CountedItem[] | null) {
	const labels = items
		?.map((item) => {
			if (!item.name) {
				return null
			}

			return item.callCount && item.callCount > 1
				? `${item.name} x${item.callCount}`
				: item.name
		})
		.filter(Boolean)

	return labels?.length ? labels.join(', ') : '-'
}

function formatTokens(usage?: MessageRow['aiUsage']) {
	const total =
		usage?.totalTokens ??
		(typeof usage?.inputTokens === 'number' && typeof usage?.outputTokens === 'number'
			? usage.inputTokens + usage.outputTokens
			: null)

	return typeof total === 'number' ? total.toLocaleString('ko-KR') : '-'
}

export default function AgentChatMessagesTable() {
	const messages = useFormFields(([fields]) => buildMessages(fields))

	if (messages.length === 0) {
		return (
			<section className="agent-chat-messages-table">
				<h3>대화 메시지</h3>
				<p>기록된 메시지가 없습니다.</p>
			</section>
		)
	}

	return (
		<section className="agent-chat-messages-table">
			<h3>대화 메시지</h3>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead scope="col">#</TableHead>
						<TableHead scope="col">Role</TableHead>
						<TableHead scope="col">Message</TableHead>
						<TableHead scope="col">Model</TableHead>
						<TableHead scope="col">Reaction</TableHead>
						<TableHead scope="col">Tools</TableHead>
						<TableHead scope="col">Skills</TableHead>
						<TableHead scope="col">Tokens</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{messages.map((message, index) => (
						<TableRow key={message.messageId ?? index}>
							<TableCell>{index + 1}</TableCell>
							<TableCell>{message.role ?? '-'}</TableCell>
							<TableCell className="agent-chat-messages-table__message">
								{message.text || '-'}
							</TableCell>
							<TableCell>{message.aiUsage?.model ?? '-'}</TableCell>
							<TableCell>{message.reaction ?? '-'}</TableCell>
							<TableCell>{formatItems(message.usedTools)}</TableCell>
							<TableCell>{formatItems(message.usedSkills)}</TableCell>
							<TableCell>{formatTokens(message.aiUsage)}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</section>
	)
}
