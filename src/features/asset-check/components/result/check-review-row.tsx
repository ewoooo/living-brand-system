'use client'

import { AiGenerate, ChevronDown, Ruler, User } from '@carbon/icons-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ComponentProps, type ComponentType, Fragment, useState } from 'react'
import { TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import { CheckDetailRow } from '@/features/asset-check/components/result/check-detail-row'
import { CheckStatusBadge } from '@/features/asset-check/components/result/check-status-badge'
import type { RuntimeCheck as Check } from '@/features/asset-check/services/get-check-ruleset.service'
import type { CheckReviewRow as CheckReviewRowData } from '@/features/asset-check/utils/build-check-review-view'
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

/**
 * 결과 테이블 행 1개 — 셀 구성(시나리오|executor 아이콘|제목|메시지|상태|토글) + 진입 애니메이션.
 * in : CheckReviewRow & { rowIndex: number }   // 스키마는 check-review-table.tsx 참조
 * 상태 표시 근거: outcome?.rawResult.status, inProgress
 * 클릭/Enter/Space → 상세 행(CheckDetailRow) 토글
 */
export function CheckRow({
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
}: CheckReviewRowData & { rowIndex: number }) {
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
