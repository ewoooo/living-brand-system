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
import { fieldNumber, fieldRowCount, fieldString, formatNumber } from './form-fields'

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
	// 세션 사용량은 종결 시 추가된 마지막 assistant 메시지의 aiUsage와 같다(별도 컬럼 저장 없음).
	const path = `messages.${fieldRowCount(fields, 'messages') - 1}.aiUsage`

	return {
		cacheReadInputTokens: fieldNumber(fields, `${path}.cacheReadInputTokens`),
		cacheWriteInputTokens: fieldNumber(fields, `${path}.cacheWriteInputTokens`),
		callCount: fieldNumber(fields, `${path}.callCount`),
		inputTokens: fieldNumber(fields, `${path}.inputTokens`),
		model: fieldString(fields, `${path}.model`),
		outputTokens: fieldNumber(fields, `${path}.outputTokens`),
		reasoningTokens: fieldNumber(fields, `${path}.reasoningTokens`),
		totalTokens: fieldNumber(fields, `${path}.totalTokens`),
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
