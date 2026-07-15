'use client'

import { AiGenerate, ChevronDown, Ruler, User } from '@carbon/icons-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
	type ComponentProps,
	type ComponentType,
	Fragment,
	type ReactNode,
	useMemo,
	useState,
} from 'react'
import { Empty, EmptyDescription } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { contrastOptionsSchema } from '@/features/asset-check/checkers/contrast.checker'
import type { AiCheckResult, CheckResult } from '@/features/asset-check/checkers/types'
import { useCheckImages } from '@/features/asset-check/components/check-image-provider'
import {
	formatObservationActual,
	formatObservationExpected,
} from '@/features/asset-check/components/check-observation-format'
import { CHECK_STATUS } from '@/features/asset-check/components/check-status'
import type {
	RuntimeCheck as Check,
	CheckSection,
} from '@/features/asset-check/services/get-check-ruleset.service'
import {
	buildCheckReviewView,
	type CheckReviewRow,
} from '@/features/asset-check/utils/build-check-review-view'
import { cn } from '@/lib/utils'

const EXECUTOR: Record<
	string,
	{ label: string; Icon: ComponentType<{ size?: number }>; desc: string }
> = {
	deterministic: { label: 'deterministic', Icon: Ruler, desc: '체커가 직접 판정하는 기준' },
	heuristic: { label: 'heuristic', Icon: AiGenerate, desc: 'AI 평가를 경유하는 기준' },
	manual: { label: 'manual', Icon: User, desc: '브랜드 담당자 확인이 필요한 기준' },
}

const CHECK_BORDER = 'border-border border-t'

function CheckRow({
	check,
	rowId,
	rowIndex,
	scenarioLabel,
	appliesTo,
	guidelineHref,
	anchorId,
	outcome,
	inProgress,
	detail,
}: CheckReviewRow & { rowIndex: number }) {
	const [open, setOpen] = useState(false)
	const shouldReduceMotion = useReducedMotion()

	return (
		<Fragment>
			<AnimatedCheckTableRow
				id={anchorId ?? undefined}
				role="button"
				aria-expanded={open}
				aria-label={`${check.title} 상세 보기`}
				rowIndex={rowIndex}
				shouldReduceMotion={shouldReduceMotion}
				onClick={() => setOpen((value) => !value)}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault()
						setOpen((value) => !value)
					}
				}}
				tabIndex={0}
				className="border-0 scroll-mt-72 cursor-pointer"
			>
				<CheckScenarioCell scenarioLabel={scenarioLabel} />
				<TableCell className={cn('w-0 py-2.5 pr-3 align-top', CHECK_BORDER)}>
					<CheckExecutorIcon check={check} />
				</TableCell>
				<CheckTitleCell title={check.title} />
				<CheckMessageCell
					detail={detail}
					outcome={outcome}
					shouldReduceMotion={shouldReduceMotion}
				/>
				<CheckStatusCell
					outcome={outcome}
					inProgress={inProgress}
					shouldReduceMotion={shouldReduceMotion}
				/>
				<CheckToggleCell open={open} />
			</AnimatedCheckTableRow>
			<AnimatePresence initial={false}>
				{open && (
					<CheckDetailRow
						key={`${rowId}:detail`}
						check={check}
						appliesTo={appliesTo}
						guidelineHref={guidelineHref}
						outcome={outcome}
						shouldReduceMotion={shouldReduceMotion}
					/>
				)}
			</AnimatePresence>
		</Fragment>
	)
}

function AnimatedCheckTableRow({
	rowIndex,
	shouldReduceMotion,
	...props
}: ComponentProps<typeof motion.tr> & {
	rowIndex: number
	shouldReduceMotion: boolean | null
}) {
	return (
		<motion.tr
			initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
			animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
			transition={{
				duration: 0.22,
				ease: 'easeOut',
				delay: Math.min(rowIndex * 0.025, 0.18),
			}}
			{...props}
		/>
	)
}

function CheckScenarioCell({ scenarioLabel }: { scenarioLabel: string | null }) {
	return (
		<TableCell className={cn('w-44 py-2.5 pr-4 align-top', scenarioLabel && CHECK_BORDER)}>
			{scenarioLabel && <span className="type-callout-emphasized">{scenarioLabel}</span>}
		</TableCell>
	)
}

function CheckTitleCell({ title }: { title: string }) {
	return (
		<TableCell className={cn('type-callout w-56 py-2.5 pr-4 align-top', CHECK_BORDER)}>
			{title}
		</TableCell>
	)
}

function CheckMessageCell({
	detail,
	outcome,
	shouldReduceMotion,
}: {
	detail: string | null
	outcome?: CheckResult
	shouldReduceMotion: boolean | null
}) {
	return (
		<TableCell
			className={cn('type-callout py-2.5 pr-3 align-top whitespace-normal', CHECK_BORDER)}
		>
			<AnimatePresence initial={false} mode="wait">
				{detail && (
					<motion.span
						key={`${outcome?.rawResult.status ?? 'detail'}:${detail}`}
						initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
						animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
						exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
						transition={{ duration: 0.16, ease: 'easeOut' }}
						className={cn(
							'type-caption-1 block',
							outcome?.rawResult.status === 'fail'
								? 'text-destructive'
								: 'text-foreground-muted',
						)}
					>
						{detail}
					</motion.span>
				)}
			</AnimatePresence>
		</TableCell>
	)
}

function CheckStatusCell({
	outcome,
	inProgress,
	shouldReduceMotion,
}: {
	outcome?: CheckResult
	inProgress: boolean
	shouldReduceMotion: boolean | null
}) {
	return (
		<TableCell className={cn('w-0 py-2.5 pr-3 align-top', CHECK_BORDER)}>
			<AnimatePresence initial={false} mode="wait">
				<CheckStatusBadge
					key={outcome?.rawResult.status ?? (inProgress ? 'running' : 'idle')}
					outcome={outcome}
					inProgress={inProgress}
					shouldReduceMotion={shouldReduceMotion}
				/>
			</AnimatePresence>
		</TableCell>
	)
}

function CheckToggleCell({ open }: { open: boolean }) {
	return (
		<TableCell className={cn('w-0 py-2.5 pr-1 text-right align-top', CHECK_BORDER)}>
			<ChevronDown
				size={16}
				className={cn(
					'inline-block text-foreground-muted transition-transform',
					open && 'rotate-180',
				)}
			/>
		</TableCell>
	)
}

function CheckExecutorIcon({ check }: { check: Check }) {
	const executor = EXECUTOR[check.executor] ?? { label: check.executor, Icon: User, desc: '' }
	const ExecutorIcon = executor.Icon

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex text-foreground-muted">
					<ExecutorIcon size={16} />
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<span className="type-caption-1-emphasized">{executor.label}</span>
				{executor.desc && (
					<span className="type-caption-1 block opacity-80">{executor.desc}</span>
				)}
			</TooltipContent>
		</Tooltip>
	)
}

function CheckStatusBadge({
	outcome,
	inProgress,
	shouldReduceMotion,
}: {
	outcome?: CheckResult
	inProgress: boolean
	shouldReduceMotion: boolean | null
}) {
	if (outcome) {
		return (
			<motion.span
				initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 3, scale: 0.96 }}
				animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
				exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -3, scale: 0.96 }}
				transition={{ duration: 0.16, ease: 'easeOut' }}
				className={cn(
					'type-subheadline-emphasized inline-block whitespace-nowrap rounded px-1.5 py-0.5',
					CHECK_STATUS[outcome.rawResult.status].pill,
				)}
			>
				{CHECK_STATUS[outcome.rawResult.status].label}
			</motion.span>
		)
	}
	if (inProgress) {
		return (
			<motion.span
				initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
				animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
				exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
				transition={{ duration: 0.14, ease: 'easeOut' }}
				className="inline-flex justify-center"
				title="검수 중"
			>
				<Spinner className="size-3.5 text-foreground-muted" />
			</motion.span>
		)
	}
	return null
}

function CheckDetailRow({
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
						<code className="type-subheadline inline-flex items-center whitespace-nowrap rounded-md bg-fill-muted px-2 py-0.5 font-mono text-foreground">
							{check.key}
						</code>
					</div>
				</CheckDetailCollapse>
			</TableCell>
			<TableCell className="pt-0 pb-0 pr-3 align-top whitespace-normal" colSpan={3}>
				<CheckDetailCollapse shouldReduceMotion={shouldReduceMotion}>
					<div className="space-y-2 pb-3">
						{appliesTo.length > 1 && (
							<p className="type-caption-1 text-foreground-muted">
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
			<table className="w-full text-left text-xs">
				<caption className="sr-only">휴리스틱 판정 기준별 비교</caption>
				<thead className="bg-white/5 text-muted-foreground">
					<tr>
						<th className="px-3 py-2 font-medium">판정 질문</th>
						<th className="px-3 py-2 font-medium">기준값</th>
						<th className="px-3 py-2 font-medium">관찰값</th>
						<th className="px-3 py-2 font-medium">결과</th>
					</tr>
				</thead>
				<tbody>
					{observations.map((observation) => (
						<tr key={observation.criterionId} className="border-t">
							<td className="px-3 py-2 align-top">
								{observation.question}
								<p className="mt-1 text-muted-foreground">{observation.reason}</p>
							</td>
							<td className="px-3 py-2 align-top whitespace-nowrap">
								{formatObservationExpected(observation)}
							</td>
							<td className="px-3 py-2 align-top whitespace-nowrap">
								{formatObservationActual(observation)} ({observation.confidence}%)
							</td>
							<td className="px-3 py-2 align-top whitespace-nowrap">
								{observation.satisfied === true
									? '충족'
									: observation.satisfied === false
										? '미충족'
										: observation.actual === 'not_applicable'
											? '해당 없음'
											: '검토 필요'}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function CheckFacts({ facts }: { facts: CheckResult['rawResult']['facts'] }) {
	if (!facts || Object.keys(facts).length === 0) return null

	return (
		<dl className="type-caption-1 grid gap-1.5 rounded-md bg-fill-muted px-3 py-2">
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
					<dt className="text-foreground-muted">금지 신호</dt>
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
			<dt className="text-foreground-muted">{label}</dt>
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

export function CheckSections({ sections }: { sections: CheckSection[] }) {
	const { scenarios, scenarioKey, selectedId, selected, showFailOnly } = useCheckImages()
	const { rows } = useMemo(
		() => buildCheckReviewView({ sections, scenarios, scenarioKey, selected, showFailOnly }),
		[sections, scenarios, scenarioKey, selected, showFailOnly],
	)

	return (
		<TooltipProvider delayDuration={150}>
			<div className="py-8">
				<Table className="table-fixed border-collapse">
					<CheckTableColumns />
					<TableBody>
						{rows.map((row, index) => (
							<CheckRow
								key={`${selectedId ?? 'empty'}:${row.rowId}`}
								{...row}
								rowIndex={index}
							/>
						))}
					</TableBody>
				</Table>
				{showFailOnly && rows.length === 0 && (
					<Empty>
						<EmptyDescription>미통과 항목이 없습니다.</EmptyDescription>
					</Empty>
				)}
			</div>
		</TooltipProvider>
	)
}

function CheckTableColumns() {
	return (
		<colgroup>
			<col className="w-44" />
			<col className="w-8" />
			<col className="w-56" />
			<col />
			<col className="w-36" />
			<col className="w-8" />
		</colgroup>
	)
}
