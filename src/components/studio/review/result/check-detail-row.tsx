'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
import type { AiCheckResult, CheckResult } from '@/features/asset-check/checkers/types'
import { formatObservationActual, formatObservationExpected } from './check-observation-format'

/**
 * 결과 행 확장 상세 — 판정 근거를 rawResult에서 읽어 표시.
 * in : { appliesTo: string[]; outcome?: CheckResult }
 * 소비 필드:
 *   outcome.rawResult.observations   // AiCheckResult 전용:
 *     { criterionId, question, kind?: 'presence'|'measure',
 *       expected: 'present'|'absent'|number, operator?: 'gte'|'lte'|'between', max?, unit?,
 *       actual: 'present'|'absent'|'uncertain'|'not_applicable'|number,
 *       confidence: number, reason: string, satisfied: boolean | null }[]
 */
export function CheckDetailRow({
	appliesTo,
	outcome,
	shouldReduceMotion,
}: {
	appliesTo: string[]
	outcome?: CheckResult
	shouldReduceMotion: boolean | null
}) {
	const appliesToText = appliesTo.join(', ')
	const observations =
		outcome && 'observations' in outcome.rawResult ? outcome.rawResult.observations : undefined

	return (
		<motion.tr
			data-slot="check-detail-row"
			className="border-0"
			exit={{ visibility: 'visible' }}
			transition={{ duration: 0.18, ease: 'easeOut' }}
		>
			<TableCell className="pt-0 pb-0 pr-3 align-top whitespace-normal" colSpan={5}>
				<span className="sr-only">상세 정보</span>
				<CheckDetailCollapse shouldReduceMotion={shouldReduceMotion}>
					<div className="space-y-2 pb-3">
						{appliesTo.length > 1 && (
							<Typography size="xs" tone="muted">
								적용 위치: {appliesToText}
							</Typography>
						)}

						<HeuristicObservations observations={observations} />
					</div>
				</CheckDetailCollapse>
			</TableCell>
		</motion.tr>
	)
}

function HeuristicObservations({ observations }: { observations: AiCheckResult['observations'] }) {
	if (!observations?.length) return null

	return (
		<div
			data-slot="heuristic-observations"
			className="overflow-x-auto rounded-sm border border-border"
		>
			<Table className="font-body text-sm font-normal">
				<TableCaption className="sr-only">결과 비교</TableCaption>
				<TableHeader className="border-b bg-fill-muted/50 text-muted-foreground">
					<TableRow>
						<TableHead className="px-3 py-2">질문</TableHead>
						<TableHead className="px-3 py-2">기준</TableHead>
						<TableHead className="px-3 py-2">관찰</TableHead>
						<TableHead className="px-3 py-2">결과</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{observations.map((observation) => (
						<TableRow key={observation.criterionId}>
							<TableCell className="px-3 py-2 align-top whitespace-normal">
								<Typography size="sm" tone="muted">
									{observation.question}
								</Typography>
								<Typography size="sm" tone="muted" className="mt-1">
									{observation.reason}
								</Typography>
							</TableCell>
							<TableCell className="px-3 py-2 align-top">
								{formatObservationExpected(observation)}
							</TableCell>
							<TableCell className="px-3 py-2 align-top">
								{formatObservationActual(observation)} ({observation.confidence}%)
							</TableCell>
							<TableCell className="px-3 py-2 align-top">
								{observation.satisfied === true
									? '충족'
									: observation.satisfied === false
										? '미충족'
										: observation.actual === 'not_applicable'
											? '해당 없음'
											: '검토 필요'}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

function CheckDetailCollapse({
	children,
	shouldReduceMotion,
}: {
	children: ReactNode
	shouldReduceMotion: boolean | null
}) {
	return (
		<motion.div
			data-slot="check-detail-collapse"
			className="overflow-hidden"
			initial={shouldReduceMotion ? false : { height: 0 }}
			animate={shouldReduceMotion ? {} : { height: 'auto' }}
			exit={shouldReduceMotion ? {} : { height: 0 }}
			transition={{ duration: 0.18, ease: 'easeOut' }}
		>
			{children}
		</motion.div>
	)
}
