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
import { contrastOptionsSchema } from '@/features/asset-check/checkers/contrast.checker'
import type { AiCheckResult, CheckResult } from '@/features/asset-check/checkers/types'
import {
	formatObservationActual,
	formatObservationExpected,
} from '@/features/asset-check/components/result/check-observation-format'
import type { RuntimeCheck as Check } from '@/features/asset-check/services/get-check-ruleset.service'

/**
 * 결과 행 확장 상세 — 판정 근거를 rawResult에서 읽어 표시.
 * in : { check: RuntimeCheck; appliesTo: string[]; guidelineHref: string; outcome?: CheckResult }
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
	check,
	appliesTo,
	guidelineHref,
	outcome,
	shouldReduceMotion,
}: {
	check: Check
	appliesTo: string[]
	guidelineHref: string
	outcome?: CheckResult
	shouldReduceMotion: boolean | null
}) {
	const appliesToText = appliesTo.join(', ')
	const facts = outcome?.rawResult.facts
	const observations =
		outcome && 'observations' in outcome.rawResult ? outcome.rawResult.observations : undefined

	return (
		<motion.tr
			className="border-0"
			exit={{ visibility: 'visible' }}
			transition={{ duration: 0.18, ease: 'easeOut' }}
		>
			<TableCell className="p-0" colSpan={2}>
				<span className="sr-only">상세 정보</span>
			</TableCell>
			<TableCell className="w-56 pt-0 pb-0 pr-4 align-top">
				<CheckDetailCollapse shouldReduceMotion={shouldReduceMotion}>
					<div className="pb-3">
						<code className="type-subheadline inline-flex items-center whitespace-nowrap rounded-md bg-muted px-2 py-0.5 font-mono text-foreground">
							{check.key}
						</code>
					</div>
				</CheckDetailCollapse>
			</TableCell>
			<TableCell className="pt-0 pb-0 pr-3 align-top whitespace-normal" colSpan={3}>
				<CheckDetailCollapse shouldReduceMotion={shouldReduceMotion}>
					<div className="space-y-2 pb-3">
						{appliesTo.length > 1 && (
							<p className="type-caption-1 text-muted-foreground">
								적용 위치: {appliesToText}
							</p>
						)}
						<a
							href={guidelineHref}
							target="_blank"
							rel="noreferrer"
							className="type-callout inline-flex underline underline-offset-2 hover:text-foreground"
						>
							관련 가이드라인 보기
						</a>
						<CheckExecutionDetails check={check} outcome={outcome} />
						<CheckFacts facts={facts} />
						<HeuristicObservations observations={observations} />
					</div>
				</CheckDetailCollapse>
			</TableCell>
		</motion.tr>
	)
}

function CheckExecutionDetails({ check, outcome }: { check: Check; outcome?: CheckResult }) {
	const comparison = outcome?.rawResult.comparisons?.[0]
	const configuredCriterion =
		check.checker.implementationKey === 'contrast'
			? contrastOptionsSchema.safeParse(check.options).data?.criteria[0]
			: undefined
	const criterion = comparison ?? configuredCriterion
	const reasonCode = outcome?.rawResult.reasonCode

	return (
		<dl className="type-caption-1 grid gap-1.5 rounded-md border px-3 py-2">
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

function HeuristicObservations({ observations }: { observations: AiCheckResult['observations'] }) {
	if (!observations?.length) return null

	return (
		<div className="overflow-x-auto rounded-md border">
			<Table className="type-caption-1">
				<TableCaption className="sr-only">휴리스틱 판정 기준별 비교</TableCaption>
				<TableHeader className="bg-fill-muted/50 text-foreground-muted">
					<TableRow>
						<TableHead className="px-3 py-2">판정 질문</TableHead>
						<TableHead className="px-3 py-2">기준값</TableHead>
						<TableHead className="px-3 py-2">관찰값</TableHead>
						<TableHead className="px-3 py-2">결과</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{observations.map((observation) => (
						<TableRow key={observation.criterionId}>
							<TableCell className="px-3 py-2 align-top whitespace-normal">
								{observation.question}
								<p className="mt-1 text-foreground-muted">{observation.reason}</p>
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

function CheckFacts({ facts }: { facts: CheckResult['rawResult']['facts'] }) {
	if (!facts || Object.keys(facts).length === 0) return null

	return (
		<dl className="type-caption-1 grid gap-1.5 rounded-md bg-muted px-3 py-2">
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
		<div className="grid grid-cols-[5rem_1fr] gap-2">
			<dt className="text-muted-foreground">{label}</dt>
			<dd>{value}</dd>
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
