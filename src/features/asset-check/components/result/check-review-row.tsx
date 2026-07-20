'use client'

import { AiGenerate, ChevronDown, Ruler, User } from '@carbon/icons-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ComponentType, useState } from 'react'
import { TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import { CheckDetailRow } from '@/features/asset-check/components/result/check-detail-row'
import { CheckStatusBadge } from '@/features/asset-check/components/result/check-status-badge'
import type { RuntimeCheck as Check } from '@/features/asset-check/domain/runtime-check'
import type { CheckReviewRow as CheckReviewRowData } from '@/features/asset-check/utils/build-check-review-view'
import { cn } from '@/lib/utils'

const EXECUTOR: Record<
	Check['executor'],
	{ label: string; Icon: ComponentType<{ size?: number }>; desc: string }
> = {
	deterministic: { label: 'deterministic', Icon: Ruler, desc: '알고리즘' },
	heuristic: { label: 'heuristic', Icon: AiGenerate, desc: 'AI 평가' },
	manual: { label: 'manual', Icon: User, desc: '브랜드 담당자' },
}

const CHECK_BORDER = 'border-border border-t'

/** 검수 기준 한 건의 요약을 표시하고, 행 조작 시 판정 근거 상세를 펼친다. */
export function CheckRow({
	check,
	rowId,
	rowIndex,
	appliesTo,
	guidelineHref,
	anchorId,
	outcome,
	inProgress,
	expandable,
	detail,
}: CheckReviewRowData & { rowIndex: number }) {
	const [open, setOpen] = useState(false)
	const shouldReduceMotion = useReducedMotion()

	return (
		<>
			<motion.tr
				id={anchorId ?? undefined}
				role={expandable ? 'button' : undefined}
				aria-expanded={expandable ? open : undefined}
				aria-label={expandable ? `${check.title} 상세 보기` : undefined}
				initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
				animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
				transition={{
					duration: 0.22,
					ease: 'easeOut',
					delay: Math.min(rowIndex * 0.025, 0.18),
				}}
				onClick={expandable ? () => setOpen((value) => !value) : undefined}
				onKeyDown={
					expandable
						? (event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault()
									setOpen((value) => !value)
								}
							}
						: undefined
				}
				tabIndex={expandable ? 0 : undefined}
				className={cn('border-0 scroll-mt-72', expandable && 'cursor-pointer')}
			>
				{/* 판정 주체: 자동 측정 / AI / 담당자 */}
				<TableCell className={cn('py-2.5 pr-3 align-top', CHECK_BORDER)}>
					<CheckExecutorIcon check={check} />
				</TableCell>
				{/* 검사 항목명 */}
				<TableCell
					className={cn(
						'py-2.5 pr-4 align-top whitespace-normal break-words font-body text-sm font-normal',
						CHECK_BORDER,
					)}
				>
					{check.title}
					<a
						href={guidelineHref}
						target="_blank"
						rel="noreferrer"
						className="inline-flex pl-1 text-xs text-muted-foreground underline underline-offset-1 hover:text-foreground"
					>
						↗
					</a>
				</TableCell>
				{/* 판정 메시지: 미통과 사유 또는 진행 안내 */}
				<CheckMessageCell
					detail={detail}
					inProgress={inProgress}
					outcome={outcome}
					shouldReduceMotion={shouldReduceMotion}
				/>
				{/* 판정 상태: 결과 배지 또는 검사 중 표시 */}
				<TableCell className={cn('py-2.5 pr-3 align-top', CHECK_BORDER)}>
					<AnimatePresence initial={false} mode="wait">
						<CheckStatusBadge
							key={outcome?.rawResult.status ?? (inProgress ? 'running' : 'idle')}
							outcome={outcome}
							inProgress={inProgress}
							shouldReduceMotion={shouldReduceMotion}
						/>
					</AnimatePresence>
				</TableCell>
				{/* 상세 열기/닫기 */}
				<TableCell className={cn('py-2.5 pr-1 text-right align-top', CHECK_BORDER)}>
					{expandable && (
						<ChevronDown
							size={16}
							className={cn(
								'inline-block text-muted-foreground transition-transform',
								open && 'rotate-180',
							)}
						/>
					)}
				</TableCell>
			</motion.tr>
			<AnimatePresence initial={false}>
				{expandable && open && (
					<CheckDetailRow
						key={`${rowId}:detail`}
						check={check}
						appliesTo={appliesTo}
						outcome={outcome}
						shouldReduceMotion={shouldReduceMotion}
					/>
				)}
			</AnimatePresence>
		</>
	)
}

/** 판정 상태가 바뀔 때 미통과 사유나 진행 메시지를 전환해 표시한다. */
function CheckMessageCell({
	detail,
	inProgress,
	outcome,
	shouldReduceMotion,
}: {
	detail: string | null
	inProgress: boolean
	outcome?: CheckResult
	shouldReduceMotion: boolean | null
}) {
	return (
		<TableCell
			className={cn('py-2.5 pr-3 align-top whitespace-normal break-words', CHECK_BORDER)}
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
							'block font-body text-sm font-normal',
							inProgress && 'shimmer',
							outcome?.rawResult.status === 'fail'
								? 'text-destructive'
								: 'text-muted-foreground',
						)}
					>
						{detail}
					</motion.span>
				)}
			</AnimatePresence>
		</TableCell>
	)
}

function CheckExecutorIcon({ check }: { check: Check }) {
	const executor = EXECUTOR[check.executor]
	const ExecutorIcon = executor.Icon

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex text-muted-foreground">
					<ExecutorIcon size={16} />
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<span className="font-body text-xs font-medium">{executor.label}</span>
				{executor.desc && (
					<span className="block font-body text-xs font-normal opacity-80">
						{executor.desc}
					</span>
				)}
			</TooltipContent>
		</Tooltip>
	)
}
