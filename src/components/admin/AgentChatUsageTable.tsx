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
import { fieldNumber, fieldString, formatNumber } from './form-fields'

type UsageRow = {
	cacheReadInputTokens?: number | null
	cacheWriteInputTokens?: number | null
	callCount?: number | null
	inputTokens?: number | null
	model?: string | null
	outputTokens?: number | null
	reasoningTokens?: number | null
	totalTokens?: number | null
}

function buildUsage(fields: FormState): UsageRow {
	return {
		cacheReadInputTokens: fieldNumber(fields, 'aiUsage.cacheReadInputTokens'),
		cacheWriteInputTokens: fieldNumber(fields, 'aiUsage.cacheWriteInputTokens'),
		callCount: fieldNumber(fields, 'aiUsage.callCount'),
		inputTokens: fieldNumber(fields, 'aiUsage.inputTokens'),
		model: fieldString(fields, 'aiUsage.model'),
		outputTokens: fieldNumber(fields, 'aiUsage.outputTokens'),
		reasoningTokens: fieldNumber(fields, 'aiUsage.reasoningTokens'),
		totalTokens: fieldNumber(fields, 'aiUsage.totalTokens'),
	}
}

export default function AgentChatUsageTable() {
	const usage = useFormFields(([fields]) => buildUsage(fields))

	return (
		<section className="agent-chat-usage-table">
			<h3>AI Usage</h3>
			<p>Agent 채팅 비용 분석에 쓰는 모델과 토큰 사용량입니다.</p>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead scope="col">Model</TableHead>
						<TableHead scope="col">Calls</TableHead>
						<TableHead scope="col">Input</TableHead>
						<TableHead scope="col">Output</TableHead>
						<TableHead scope="col">Total</TableHead>
						<TableHead scope="col">Cache Read</TableHead>
						<TableHead scope="col">Cache Write</TableHead>
						<TableHead scope="col">Reasoning</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell>{usage.model ?? '-'}</TableCell>
						<TableCell>{formatNumber(usage.callCount)}</TableCell>
						<TableCell>{formatNumber(usage.inputTokens)}</TableCell>
						<TableCell>{formatNumber(usage.outputTokens)}</TableCell>
						<TableCell>{formatNumber(usage.totalTokens)}</TableCell>
						<TableCell>{formatNumber(usage.cacheReadInputTokens)}</TableCell>
						<TableCell>{formatNumber(usage.cacheWriteInputTokens)}</TableCell>
						<TableCell>{formatNumber(usage.reasoningTokens)}</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</section>
	)
}
