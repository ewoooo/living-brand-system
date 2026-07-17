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
// deterministic 상세 표시를 재개할 때 함께 복구한다.
// import { Badge } from '@/components/ui/badge'
// import { contrastOptionsSchema } from '@/features/asset-check/checkers/contrast.checker'
import type { AiCheckResult, CheckResult } from '@/features/asset-check/checkers/types'
import {
	formatObservationActual,
	formatObservationExpected,
} from '@/features/asset-check/components/result/check-observation-format'
import type { RuntimeCheck as Check } from '@/features/asset-check/domain/runtime-check'

/**
 * 결과 행 확장 상세 — 판정 근거를 rawResult에서 읽어 표시.
 * in : { check: RuntimeCheck; appliesTo: string[]; outcome?: CheckResult }
 * 소비 필드:
 *   check.key, check.checker { key, implementationKey }, check.executor, check.options
 *   outcome.rawResult.comparisons[0] { measurement, operator, expected, actual, satisfied }
 *   outcome.rawResult.facts          // foreground/background/detectedCategory/confidence/prohibitedSignals
 *   outcome.rawResult.reasonCode     // 'color_pair_not_found' | 'missing_measurement' | ...
 *   outcome.rawResult.observations   // AiCheckResult 전용:
 *     { criterionId, question, kind?: 'presence'|'measure',
 *       expected: 'present'|'absent'|number, operator?: 'gte'|'lte'|'between', max?, unit?,
 *       actual: 'present'|'absent'|'uncertain'|'not_applicable'|number,
 *       confidence: number, reason: string, satisfied: boolean | null }[]
 */
export function CheckDetailRow({
	// check, // deterministic 상세 표시를 재개할 때 사용한다.
	appliesTo,
	outcome,
	shouldReduceMotion,
}: {
	check: Check
	appliesTo: string[]
	outcome?: CheckResult
	shouldReduceMotion: boolean | null
}) {
	const appliesToText = appliesTo.join(', ')
	// const facts = outcome?.rawResult.facts
	const observations =
		outcome && 'observations' in outcome.rawResult ? outcome.rawResult.observations : undefined

	return (
		<motion.tr
			className="border-0"
			exit={{ visibility: 'visible' }}
			transition={{ duration: 0.18, ease: 'easeOut' }}
		>
			<TableCell className="p-0" colSpan={3}></TableCell>
			<TableCell className="pt-0 pb-0 pr-3 align-top whitespace-normal" colSpan={3}>
				<span className="sr-only">상세 정보</span>
				<CheckDetailCollapse shouldReduceMotion={shouldReduceMotion}>
					<div className="space-y-2 pb-3">
						{appliesTo.length > 1 && (
							<p className="font-body text-xs font-normal text-muted-foreground">
								적용 위치: {appliesToText}
							</p>
						)}

						{/* <CheckExecutionDetails check={check} outcome={outcome} /> */}
						{/* <CheckFacts facts={facts} /> */}
						<HeuristicObservations observations={observations} />
					</div>
				</CheckDetailCollapse>
			</TableCell>
		</motion.tr>
	)
}

/* deterministic 상세 표시를 재개할 때 함께 복구한다.
function CheckExecutionDetails({ check, outcome }: { check: Check; outcome?: CheckResult }) {
	const comparison = outcome?.rawResult.comparisons?.[0]
	const configuredCriterion =
		check.checker.implementationKey === 'contrast'
			? contrastOptionsSchema.safeParse(check.options).data?.criteria[0]
			: undefined
	const criterion = comparison ?? configuredCriterion
	const reasonCode = outcome?.rawResult.reasonCode

	return (
		<dl className="grid gap-1.5 rounded-md border px-3 py-2 font-body text-xs font-normal">
			<CheckFact
				label="체커"
				value={
					check.checker.implementationKey
						? `${check.checker.key} · ${check.checker.implementationKey}`
						: check.checker.key
				}
			/>
			<CheckFact label="판정 방식" value={executorLabel(check.executor)} />
			{criterion?.measurement === 'contrastRatio' && (
				<CheckFact
					label="기준"
					value={`대비율 ${operatorLabel(criterion.operator)} ${criterion.expected}:1`}
				/>
			)}
			{comparison?.measurement === 'contrastRatio' && (
				<CheckFact
					label="측정 결과"
					value={`${comparison.actual}:1 · ${comparison.satisfied ? '기준 충족' : '기준 미충족'}`}
				/>
			)}
			{reasonCode && <CheckFact label="검토 사유" value={reasonLabel(reasonCode)} />}
		</dl>
	)
}

function executorLabel(executor: Check['executor']) {
	if (executor === 'deterministic') return '자동 측정'
	if (executor === 'heuristic') return 'AI 평가'
	return '담당자 확인'
}

function operatorLabel(operator: string) {
	if (operator === 'gte') return '≥'
	if (operator === 'lte') return '≤'
	if (operator === 'eq') return '='
	return operator
}

function reasonLabel(reasonCode: string) {
	if (reasonCode === 'color_pair_not_found') return '비교할 두 색상을 이미지에서 찾지 못했습니다.'
	if (reasonCode === 'missing_measurement') return '판정에 필요한 측정값이 없습니다.'
	return reasonCode
}
*/

function HeuristicObservations({ observations }: { observations: AiCheckResult['observations'] }) {
	if (!observations?.length) return null

	return (
		<div className="overflow-x-auto rounded-sm border border-border">
			<Table className="font-body text-xs font-normal">
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
								<p className="text-muted-foreground">{observation.question}</p>
								<p className="mt-1 text-muted-foreground">{observation.reason}</p>
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

/* deterministic 상세 표시를 재개할 때 함께 복구한다.
function CheckFacts({ facts }: { facts: CheckResult['rawResult']['facts'] }) {
	if (!facts || Object.keys(facts).length === 0) return null

	return (
		<dl className="grid gap-1.5 rounded-md bg-muted px-3 py-2 font-body text-xs font-normal">
			{typeof facts.foreground === 'string' && (
				<CheckFact label="전경색" value={facts.foreground} />
			)}
			{typeof facts.background === 'string' && (
				<CheckFact label="배경색" value={facts.background} />
			)}
			{typeof facts.detectedCategory === 'string' && (
				<CheckFact label="검출 분류" value={facts.detectedCategory} />
			)}
			{typeof facts.confidence === 'number' && (
				<CheckFact label="신뢰도" value={`${facts.confidence}%`} />
			)}
			{Array.isArray(facts.prohibitedSignals) && facts.prohibitedSignals.length > 0 && (
				<div className="grid gap-1">
					<dt className="text-muted-foreground">금지 신호</dt>
					<dd>
						<ul className="list-disc space-y-0.5 pl-4">
							{facts.prohibitedSignals.map((signal) => (
								<li key={signal}>{signal}</li>
							))}
						</ul>
					</dd>
				</div>
			)}
		</dl>
	)
}

function CheckFact({ label, value }: { label: string; value: string }) {
	return (
		<Badge className="flex bg-accent gap-2">
			<dt className="text-muted-foreground">{label}</dt>
			<dd>{value}</dd>
		</Badge>
	)
}
*/

function CheckDetailCollapse({
	children,
	shouldReduceMotion,
}: {
	children: ReactNode
	shouldReduceMotion: boolean | null
}) {
	return (
		<motion.div
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
