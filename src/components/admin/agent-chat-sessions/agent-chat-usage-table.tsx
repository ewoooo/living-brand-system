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
import { fieldNumber, fieldRowCount, fieldString, formatNumber } from '../shared/form-fields'

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

const HEAD_CLASS = 'align-top text-sm font-semibold text-muted-foreground'
const CELL_CLASS = 'align-top'

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

export function AgentChatUsageTable() {
	const usage = useFormFields(([fields]) => buildUsage(fields))

	return (
		<section className="mb-5">
			<h3 className="m-0 mb-2.5">AI Usage</h3>
			<p className="m-0 text-muted-foreground">
				Agent 채팅 비용 분석에 쓰는 모델과 토큰 사용량입니다.
			</p>
			<Table className="min-w-[960px] border-collapse">
				<TableHeader>
					<TableRow>
						<TableHead scope="col" className={HEAD_CLASS}>
							Model
						</TableHead>
						<TableHead scope="col" className={HEAD_CLASS}>
							Calls
						</TableHead>
						<TableHead scope="col" className={HEAD_CLASS}>
							Input
						</TableHead>
						<TableHead scope="col" className={HEAD_CLASS}>
							Output
						</TableHead>
						<TableHead scope="col" className={HEAD_CLASS}>
							Total
						</TableHead>
						<TableHead scope="col" className={HEAD_CLASS}>
							Cache Read
						</TableHead>
						<TableHead scope="col" className={HEAD_CLASS}>
							Cache Write
						</TableHead>
						<TableHead scope="col" className={HEAD_CLASS}>
							Reasoning
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell className={CELL_CLASS}>{usage.model ?? '-'}</TableCell>
						<TableCell className={CELL_CLASS}>
							{formatNumber(usage.callCount)}
						</TableCell>
						<TableCell className={CELL_CLASS}>
							{formatNumber(usage.inputTokens)}
						</TableCell>
						<TableCell className={CELL_CLASS}>
							{formatNumber(usage.outputTokens)}
						</TableCell>
						<TableCell className={CELL_CLASS}>
							{formatNumber(usage.totalTokens)}
						</TableCell>
						<TableCell className={CELL_CLASS}>
							{formatNumber(usage.cacheReadInputTokens)}
						</TableCell>
						<TableCell className={CELL_CLASS}>
							{formatNumber(usage.cacheWriteInputTokens)}
						</TableCell>
						<TableCell className={CELL_CLASS}>
							{formatNumber(usage.reasoningTokens)}
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</section>
	)
}
