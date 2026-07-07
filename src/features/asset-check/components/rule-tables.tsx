'use client'

import { AiGenerate, ChevronDown, Ruler, User } from '@carbon/icons-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ComponentProps, type ComponentType, Fragment, type ReactNode, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import { useCheckImages } from '@/features/asset-check/components/check-image-provider'
import {
	buildCheckReviewView,
	type CheckReviewRuleRow,
} from '@/features/asset-check/services/build-check-review-view.service'
import type {
	CheckSection,
	CheckRule as Rule,
} from '@/features/asset-check/services/get-check-ruleset.service'
import { cn } from '@/lib/utils'

const EXECUTOR: Record<
	string,
	{ label: string; Icon: ComponentType<{ size?: number }>; desc: string }
> = {
	deterministic: { label: 'deterministic', Icon: Ruler, desc: '체커가 직접 판정하는 기준' },
	heuristic: { label: 'heuristic', Icon: AiGenerate, desc: 'AI 평가를 경유하는 기준' },
	advisory: { label: 'advisory', Icon: User, desc: '브랜드 담당자 확인이 필요한 기준' },
}

const STATUS = {
	pass: {
		label: '통과',
		className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
	},
	ok: { label: '적합', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-400' },
	needs_review: {
		label: '검토',
		className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
	},
	fail: { label: '미통과', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' },
} as const

const RULE_BORDER = 'border-neutral-200 border-t dark:border-neutral-800'

function RuleRow({
	rule,
	rowId,
	rowIndex,
	sectionLabel,
	appliesTo,
	anchorId,
	outcome,
	inProgress,
	detail,
}: CheckReviewRuleRow & { rowIndex: number }) {
	const [open, setOpen] = useState(false)
	const shouldReduceMotion = useReducedMotion()

	return (
		<Fragment key={rowId}>
			<AnimatedRuleTableRow
				id={anchorId ?? undefined}
				aria-expanded={open}
				aria-label={`${rule.title} 상세 보기`}
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
				<RuleSectionCell sectionLabel={sectionLabel} />
				<TableCell className={cn('w-0 py-2.5 pr-3 align-top', RULE_BORDER)}>
					<RuleExecutorIcon rule={rule} />
				</TableCell>
				<RuleTitleCell title={rule.title} />
				<RuleMessageCell
					detail={detail}
					outcome={outcome}
					shouldReduceMotion={shouldReduceMotion}
				/>
				<RuleStatusCell
					outcome={outcome}
					inProgress={inProgress}
					shouldReduceMotion={shouldReduceMotion}
				/>
				<RuleToggleCell open={open} />
			</AnimatedRuleTableRow>
			<AnimatePresence initial={false}>
				{open && (
					<RuleDetailRow
						key={`${rowId}:detail`}
						rule={rule}
						appliesTo={appliesTo}
						shouldReduceMotion={shouldReduceMotion}
					/>
				)}
			</AnimatePresence>
		</Fragment>
	)
}

function AnimatedRuleTableRow({
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

function RuleSectionCell({ sectionLabel }: { sectionLabel: string | null }) {
	return (
		<TableCell className={cn('w-44 py-2.5 pr-4 align-top', sectionLabel && RULE_BORDER)}>
			{sectionLabel && <span className="font-medium text-sm">{sectionLabel}</span>}
		</TableCell>
	)
}

function RuleTitleCell({ title }: { title: string }) {
	return (
		<TableCell className={cn('w-56 py-2.5 pr-4 align-top text-sm', RULE_BORDER)}>
			{title}
		</TableCell>
	)
}

function RuleMessageCell({
	detail,
	outcome,
	shouldReduceMotion,
}: {
	detail: string | null
	outcome?: CheckResult
	shouldReduceMotion: boolean | null
}) {
	return (
		<TableCell className={cn('py-2.5 pr-3 align-top text-sm whitespace-normal', RULE_BORDER)}>
			<AnimatePresence initial={false} mode="wait">
				{detail && (
					<motion.span
						key={`${outcome?.rawResult.status ?? 'detail'}:${detail}`}
						initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
						animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
						exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
						transition={{ duration: 0.16, ease: 'easeOut' }}
						className={cn(
							'block text-xs leading-5',
							outcome?.rawResult.status === 'fail'
								? 'text-rose-600 dark:text-rose-400'
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

function RuleStatusCell({
	outcome,
	inProgress,
	shouldReduceMotion,
}: {
	outcome?: CheckResult
	inProgress: boolean
	shouldReduceMotion: boolean | null
}) {
	return (
		<TableCell className={cn('w-0 py-2.5 pr-3 align-top', RULE_BORDER)}>
			<AnimatePresence initial={false} mode="wait">
				<RuleStatusBadge
					key={outcome?.rawResult.status ?? (inProgress ? 'running' : 'idle')}
					outcome={outcome}
					inProgress={inProgress}
					shouldReduceMotion={shouldReduceMotion}
				/>
			</AnimatePresence>
		</TableCell>
	)
}

function RuleToggleCell({ open }: { open: boolean }) {
	return (
		<TableCell className={cn('w-0 py-2.5 pr-1 text-right align-top', RULE_BORDER)}>
			<ChevronDown
				size={16}
				className={cn(
					'inline-block text-muted-foreground transition-transform',
					open && 'rotate-180',
				)}
			/>
		</TableCell>
	)
}

function RuleExecutorIcon({ rule }: { rule: Rule }) {
	const executor = EXECUTOR[rule.executor] ?? { label: rule.executor, Icon: User, desc: '' }
	const ExecutorIcon = executor.Icon

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex text-muted-foreground">
					<ExecutorIcon size={16} />
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<span className="font-medium">{executor.label}</span>
				{executor.desc && <span className="block text-xs opacity-80">{executor.desc}</span>}
			</TooltipContent>
		</Tooltip>
	)
}

function RuleStatusBadge({
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
					'inline-block whitespace-nowrap rounded px-1.5 py-0.5 font-medium text-[11px]',
					STATUS[outcome.rawResult.status].className,
				)}
			>
				{STATUS[outcome.rawResult.status].label}
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
				<Spinner className="size-3.5 text-muted-foreground" />
			</motion.span>
		)
	}
	return null
}

function RuleDetailRow({
	rule,
	appliesTo,
	shouldReduceMotion,
}: {
	rule: Rule
	appliesTo: string[]
	shouldReduceMotion: boolean | null
}) {
	const appliesToText = appliesTo.join(', ')

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
				<RuleDetailCollapse shouldReduceMotion={shouldReduceMotion}>
					<div className="pb-3">
						<code className="inline-flex items-center whitespace-nowrap rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] text-secondary-foreground">
							{rule.key}
						</code>
					</div>
				</RuleDetailCollapse>
			</TableCell>
			<TableCell className="pt-0 pb-0 pr-3 align-top whitespace-normal" colSpan={3}>
				<RuleDetailCollapse shouldReduceMotion={shouldReduceMotion}>
					<div className="space-y-2 pb-3">
						{appliesTo.length > 1 && (
							<p className="text-muted-foreground text-xs">
								적용 위치: {appliesToText}
							</p>
						)}
						{rule.evidence ? (
							<blockquote className="rounded-md bg-white/5 px-3 py-2 text-muted-foreground text-xs leading-5">
								{rule.evidence}
							</blockquote>
						) : (
							<span className="text-muted-foreground text-xs">
								관련 가이드라인 없음
							</span>
						)}
						<ReferenceAssets assets={rule.referenceAssets} />
					</div>
				</RuleDetailCollapse>
			</TableCell>
		</motion.tr>
	)
}

function RuleDetailCollapse({
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

function ReferenceAssets({ assets }: { assets: Rule['referenceAssets'] }) {
	if (assets.length === 0) return null

	return (
		<div className="flex flex-wrap items-center gap-1.5 text-xs">
			<span className="text-muted-foreground">기준 이미지 {assets.length}개</span>
			{assets.map((asset) => (
				<a
					key={`${asset.url}-${asset.name}`}
					href={asset.url}
					target="_blank"
					rel="noreferrer"
					className="rounded-md border px-2 py-1 text-foreground transition-colors hover:bg-accent"
				>
					{asset.name}
				</a>
			))}
		</div>
	)
}

export function CheckSections({ sections }: { sections: CheckSection[] }) {
	const { scenarioKey, selectedId, selected, showFailOnly } = useCheckImages()
	const { rows } = buildCheckReviewView({
		sections,
		scenarioKey,
		selected,
		showFailOnly,
	})

	return (
		<TooltipProvider delayDuration={150}>
			<div className="py-8">
				<Table className="table-fixed border-collapse">
					<RuleTableColumns />
					<TableBody>
						{rows.map((row, index) => (
							<RuleRow
								{...row}
								key={`${selectedId ?? 'empty'}:${row.rowId}`}
								rowIndex={index}
							/>
						))}
					</TableBody>
				</Table>
				{showFailOnly && rows.length === 0 && (
					<p className="py-8 text-center text-muted-foreground text-sm">
						미통과 항목이 없습니다.
					</p>
				)}
			</div>
		</TooltipProvider>
	)
}

function RuleTableColumns() {
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
