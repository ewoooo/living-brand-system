'use client'

import { ChevronDown, MagicWand, Ruler, User } from '@carbon/icons-react'
import { type ComponentType, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getChecker } from '@/features/review/checkers/registry'
import { useReviewImages } from '@/features/review/hooks/use-review-images'
import type {
	ReviewSection,
	ReviewRule as Rule,
} from '@/features/review/services/get-review-ruleset.service'
import { cn } from '@/lib/utils'

interface RuleRowData {
	rule: Rule
	sectionLabel: string | null
	anchorId: string | null
}

const TIER: Record<
	string,
	{ label: string; Icon: ComponentType<{ size?: number }>; desc: string }
> = {
	A: { label: 'A · deterministic', Icon: Ruler, desc: '자로 잰 듯 확정된 값 — 믿어도 됨' },
	B: { label: 'B · heuristic', Icon: MagicWand, desc: 'AI가 추론한 값 — 100% 신뢰는 아님' },
	C: { label: 'C · advisory/human', Icon: User, desc: '사람이 직접 판단해야 하는 값' },
}

function RuleRow({ rule, sectionLabel, anchorId }: RuleRowData) {
	const [open, setOpen] = useState(false)
	const { selected } = useReviewImages()
	const implemented = getChecker(rule.key) !== null
	const isSectionStart = sectionLabel !== null

	const tier = TIER[rule.tier] ?? { label: rule.tier, Icon: User, desc: '' }
	const TierIcon = tier.Icon

	const outcome = selected?.results?.[rule.key]
	const inProgress = Boolean(selected?.checking) && !outcome
	const failDetail = outcome?.status === 'fail' ? outcome.detail : null

	const ruleBorder = 'border-neutral-200 border-t dark:border-neutral-800'

	return (
		<>
			<tr
				id={anchorId ?? undefined}
				aria-expanded={open}
				aria-label={`${rule.titleKo} 상세 보기`}
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
								<TierIcon size={16} />
							</span>
						</TooltipTrigger>
						<TooltipContent>
							<span className="font-medium">{tier.label}</span>
							{tier.desc && (
								<span className="block text-xs opacity-80">{tier.desc}</span>
							)}
						</TooltipContent>
					</Tooltip>
				</td>
				<td className={cn('w-56 py-2.5 pr-4 align-top text-sm', ruleBorder)}>
					{rule.titleKo}
				</td>
				<td className={cn('py-2.5 pr-3 align-top text-sm', ruleBorder)}>
					{failDetail && (
						<span className="text-rose-600 text-xs leading-5 dark:text-rose-400">
							{failDetail}
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
								outcome.status === 'pass'
									? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
									: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
							)}
						>
							{outcome.status === 'pass' ? 'PASS' : 'FAIL'}
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
						{rule.evidence ? (
							<blockquote className="rounded-md bg-white/5 px-3 py-2 text-muted-foreground text-xs leading-5">
								{rule.evidence}
							</blockquote>
						) : (
							<span className="text-muted-foreground text-xs">
								관련 가이드라인 없음
							</span>
						)}
					</td>
				</tr>
			)}
		</>
	)
}

export function ReviewSections({ sections }: { sections: ReviewSection[] }) {
	const { showUnimplemented, selected } = useReviewImages()
	const [showFailOnly, setShowFailOnly] = useState(false)
	const results = selected?.results

	let pass = 0
	let fail = 0
	let pendingReview = 0
	const rows: RuleRowData[] = []
	const seenSections = new Set<string>()

	for (const section of sections) {
		for (const rule of section.rules) {
			const implemented = getChecker(rule.key) !== null
			const status = results?.[rule.key]?.status

			if (implemented) {
				if (status === 'pass') pass++
				else if (status === 'fail') fail++
				else pendingReview++
			}

			if (!implemented && !showUnimplemented) continue
			if (showFailOnly && results && status !== 'fail') continue

			const first = !seenSections.has(section.slug)
			seenSections.add(section.slug)
			rows.push({
				rule,
				sectionLabel: first ? section.title : null,
				anchorId: first ? section.slug : null,
			})
		}
	}
	const reviewed = pass + fail > 0

	return (
		<TooltipProvider delayDuration={150}>
			<div className="px-8 py-8">
				{reviewed && (
					<ResultSummary
						pass={pass}
						fail={fail}
						pendingReview={pendingReview}
						showFailOnly={showFailOnly}
						onToggleFailOnly={() => setShowFailOnly((value) => !value)}
					/>
				)}
				<div className="border-neutral-200 border-b dark:border-neutral-800">
					<table className="w-full border-collapse">
						<tbody>
							{rows.map((row) => (
								<RuleRow key={row.rule.placementId} {...row} />
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
	showFailOnly,
	onToggleFailOnly,
}: {
	pass: number
	fail: number
	pendingReview: number
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
				검수 전 <span className="font-semibold tabular-nums">{pendingReview}</span>
			</span>
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
