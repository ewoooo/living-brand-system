'use client'

import { AiGenerate, ChevronDown, Ruler, User } from '@carbon/icons-react'
import { type ComponentType, Fragment, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReviewImages } from '@/features/review/hooks/use-review-images'
import {
	filterRulesetByScenario,
	getReviewScenario,
} from '@/features/review/scenarios/review-scenarios'
import type {
	ReviewSection,
	ReviewRule as Rule,
} from '@/features/review/services/get-review-ruleset.service'
import { cn } from '@/lib/utils'

interface RuleRowData {
	rule: Rule
	rowId: string
	sectionLabel: string | null
	appliesTo: string[]
	appliesToSet: Set<string>
	anchorId: string | null
}

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
		label: 'PASS',
		className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
	},
	fail: { label: 'FAIL', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' },
	needs_ai: {
		label: 'AI 대기',
		className: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
	},
	needs_review: {
		label: '담당자 검토',
		className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
	},
} as const

function RuleRow({ rule, rowId, sectionLabel, appliesTo, anchorId }: RuleRowData) {
	const [open, setOpen] = useState(false)
	const { selected } = useReviewImages()
	const implemented = rule.implemented
	const isSectionStart = sectionLabel !== null

	const executor = EXECUTOR[rule.executor] ?? { label: rule.executor, Icon: User, desc: '' }
	const ExecutorIcon = executor.Icon

	const outcome = selected?.results?.[rule.key]
	const inProgress = Boolean(selected?.checking) && !outcome
	const detail = outcome?.status !== 'pass' ? outcome?.detail : null
	const appliesToText = appliesTo.join(', ')

	const ruleBorder = 'border-neutral-200 border-t dark:border-neutral-800'

	return (
		<Fragment key={rowId}>
			<tr
				id={anchorId ?? undefined}
				aria-expanded={open}
				aria-label={`${rule.title} 상세 보기`}
				onClick={() => setOpen((value) => !value)}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault()
						setOpen((value) => !value)
					}
				}}
				tabIndex={0}
				className={cn(
					'scroll-mt-72 cursor-pointer transition-colors hover:bg-neutral-500/5 active:bg-neutral-500/10',
					!implemented && 'opacity-45',
				)}
			>
				<td className={cn('w-44 py-2.5 pr-4 align-top', isSectionStart && ruleBorder)}>
					{sectionLabel && <span className="font-medium text-sm">{sectionLabel}</span>}
				</td>
				<td className={cn('w-0 py-2.5 pr-3 align-top', ruleBorder)}>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="inline-flex text-muted-foreground">
								<ExecutorIcon size={16} />
							</span>
						</TooltipTrigger>
						<TooltipContent>
							<span className="font-medium">{executor.label}</span>
							{executor.desc && (
								<span className="block text-xs opacity-80">{executor.desc}</span>
							)}
						</TooltipContent>
					</Tooltip>
				</td>
				<td className={cn('w-56 py-2.5 pr-4 align-top text-sm', ruleBorder)}>
					{rule.title}
				</td>
				<td className={cn('py-2.5 pr-3 align-top text-sm', ruleBorder)}>
					{detail && (
						<span
							className={cn(
								'text-xs leading-5',
								outcome?.status === 'fail'
									? 'text-rose-600 dark:text-rose-400'
									: 'text-muted-foreground',
							)}
						>
							{detail}
						</span>
					)}
				</td>
				<td className={cn('w-0 py-2.5 pr-3 align-top', ruleBorder)}>
					{!implemented ? (
						<span className="inline-block whitespace-nowrap rounded bg-neutral-500/10 px-1.5 py-0.5 text-[11px] text-muted-foreground">
							개발 중
						</span>
					) : outcome ? (
						<span
							className={cn(
								'inline-block whitespace-nowrap rounded px-1.5 py-0.5 font-medium text-[11px]',
								STATUS[outcome.status].className,
							)}
						>
							{STATUS[outcome.status].label}
						</span>
					) : inProgress ? (
						<span className="inline-flex w-14 items-center" title="검수 중">
							<span className="h-1 w-full overflow-hidden rounded-full bg-neutral-500/20">
								<span className="block h-full w-1/2 animate-pulse rounded-full bg-neutral-400" />
							</span>
						</span>
					) : null}
				</td>
				<td className={cn('w-0 py-2.5 pr-1 text-right align-top', ruleBorder)}>
					<ChevronDown
						size={16}
						className={cn(
							'inline-block text-muted-foreground transition-transform',
							open && 'rotate-180',
						)}
					/>
				</td>
			</tr>
			{open && (
				<tr>
					<td colSpan={2}>
						<span className="sr-only">상세 정보</span>
					</td>
					<td className="w-56 pt-0 pb-3 pr-4 align-top">
						<code className="inline-flex items-center whitespace-nowrap rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] text-secondary-foreground">
							{rule.key}
						</code>
					</td>
					<td className="pt-0 pb-3 pr-3 align-top" colSpan={3}>
						<div className="space-y-2">
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
					</td>
				</tr>
			)}
		</Fragment>
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

export function ReviewSections({ sections }: { sections: ReviewSection[] }) {
	const { scenarioKey, selected } = useReviewImages()
	const [showFailOnly, setShowFailOnly] = useState(false)
	const results = selected?.results
	const checking = Boolean(selected?.checking)
	const visibleSections = filterRulesetByScenario(sections, getReviewScenario(scenarioKey))

	let pass = 0
	let fail = 0
	let pendingReview = 0
	const rows: RuleRowData[] = []
	const rowByRuleKey = new Map<string, RuleRowData>()
	const seenSections = new Set<string>()

	for (const section of visibleSections) {
		for (const rule of section.rules) {
			const existing = rowByRuleKey.get(rule.key)
			if (existing) {
				if (!existing.appliesToSet.has(section.title)) {
					existing.appliesToSet.add(section.title)
					existing.appliesTo.push(section.title)
				}
				continue
			}

			const implemented = rule.implemented
			const status = results?.[rule.key]?.status

			if (implemented) {
				if (status === 'pass') pass++
				else if (status === 'fail') fail++
				else pendingReview++
			}

			if (!implemented) continue
			if (showFailOnly && results && status !== 'fail') continue

			const first = !seenSections.has(section.slug)
			seenSections.add(section.slug)
			const row = {
				rule,
				rowId: `${section.slug}:${rule.key}`,
				sectionLabel: first ? section.title : null,
				appliesTo: [section.title],
				appliesToSet: new Set([section.title]),
				anchorId: first ? section.slug : null,
			}
			rows.push(row)
			rowByRuleKey.set(rule.key, row)
		}
	}
	const reviewed = Boolean(results)

	return (
		<TooltipProvider delayDuration={150}>
			<div className="px-8 py-8">
				{reviewed && (
					<ResultSummary
						pass={pass}
						fail={fail}
						pendingReview={pendingReview}
						checking={checking}
						showFailOnly={showFailOnly}
						onToggleFailOnly={() => setShowFailOnly((value) => !value)}
					/>
				)}
				<div className="border-neutral-200 border-b dark:border-neutral-800">
					<table className="w-full border-collapse">
						<tbody>
							{rows.map((row) => (
								<RuleRow key={row.rowId} {...row} />
							))}
						</tbody>
					</table>
				</div>
				{showFailOnly && rows.length === 0 && (
					<p className="py-8 text-center text-muted-foreground text-sm">
						미통과 항목이 없습니다.
					</p>
				)}
			</div>
		</TooltipProvider>
	)
}

/** 검수 결과 한눈 요약: 통과·미통과·검수 전 카운트 + 미통과만 보기 토글. */
function ResultSummary({
	pass,
	fail,
	pendingReview,
	checking,
	showFailOnly,
	onToggleFailOnly,
}: {
	pass: number
	fail: number
	pendingReview: number
	checking: boolean
	showFailOnly: boolean
	onToggleFailOnly: () => void
}) {
	return (
		<div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border bg-card px-5 py-3.5 text-sm shadow-sm">
			<span className="flex items-center gap-2">
				<span className="inline-block size-2 rounded-full bg-emerald-500" />
				통과 <span className="font-semibold tabular-nums">{pass}</span>
			</span>
			<span className="flex items-center gap-2">
				<span className="inline-block size-2 rounded-full bg-rose-500" />
				미통과 <span className="font-semibold tabular-nums">{fail}</span>
			</span>
			<span className="flex items-center gap-2 text-muted-foreground">
				<span className="inline-block size-2 rounded-full bg-neutral-400" />
				검토 필요 <span className="font-semibold tabular-nums">{pendingReview}</span>
			</span>
			{checking && (
				<span className="flex items-center gap-2 text-sky-700 text-xs dark:text-sky-400">
					<span className="inline-block size-2 animate-pulse rounded-full bg-sky-500" />
					AI 검수 중
				</span>
			)}
			<button
				type="button"
				onClick={onToggleFailOnly}
				disabled={fail === 0}
				className={cn(
					'ml-auto rounded-md border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
					showFailOnly
						? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400'
						: 'text-muted-foreground hover:bg-accent hover:text-foreground',
				)}
			>
				{showFailOnly ? '전체 보기' : '미통과만 보기'}
			</button>
		</div>
	)
}
