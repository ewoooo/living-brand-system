'use client'

import { MagicWand, Ruler, User } from '@carbon/icons-react'
import { type ComponentType, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getChecker } from '@/features/review/checkers/registry'
import { getCommentary } from '@/features/review/commentary'
import { useReviewImages } from '@/features/review/image-context'
import type { getReviewContent } from '@/features/review/navigation'
import { cn } from '@/lib/utils'

interface Rule {
	key: string
	title: string
	titleKo: string
	tier: string
	inCatalog: boolean
	evidence: string
	value: string
}

type ReviewContentChapter = ReturnType<typeof getReviewContent>[number]

/** 한 행 = 한 룰. 섹션 첫 룰에만 sectionLabel·anchorId가 실린다. */
interface RuleRowData {
	rule: Rule
	sectionSlug: string
	sectionLabel: string | null
	anchorId: string | null
}

const TIER: Record<
	string,
	{ label: string; Icon: ComponentType<{ size?: number }>; desc: string }
> = {
	automated: { label: 'automated', Icon: Ruler, desc: '자로 잰 듯 확정된 값 — 믿어도 됨' },
	assisted: { label: 'assisted', Icon: MagicWand, desc: 'AI가 추론한 값 — 100% 신뢰는 아님' },
	manual: { label: 'manual', Icon: User, desc: '사람이 직접 판단해야 하는 값' },
}

const STATUS: Record<string, { label: string; cls: string }> = {
	pass: { label: 'PASS', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
	fail: { label: 'FAIL', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' },
	pending: { label: '미개발', cls: 'bg-neutral-500/10 text-muted-foreground' },
}

function RuleRow({ rule, sectionLabel, anchorId }: Omit<RuleRowData, 'sectionSlug'>) {
	const [open, setOpen] = useState(false)
	const { selected } = useReviewImages()
	const implemented = getChecker(rule.key) !== null
	const isSectionStart = sectionLabel !== null

	const tier = TIER[rule.tier] ?? { label: rule.tier, Icon: User, desc: '' }
	const TierIcon = tier.Icon

	const outcome = selected?.results?.[rule.key]
	const inProgress = Boolean(selected?.checking) && !outcome
	const commentary =
		outcome && outcome.status !== 'pending'
			? getCommentary(rule.key, outcome.metric, outcome.status)
			: null
	const hasDetail = Boolean(rule.evidence || rule.value || outcome?.detail)

	return (
		<>
			<tr
				id={anchorId ?? undefined}
				className={cn(
					'scroll-mt-72 border-neutral-200 border-b transition-colors hover:bg-neutral-500/5 dark:border-neutral-800',
					isSectionStart && '[&>td]:pt-5',
					!implemented && 'opacity-45',
				)}
			>
				{/* 섹션명 (섹션 첫 행에만) */}
				<td className="w-44 py-2 pr-4 align-top">
					{sectionLabel && <span className="font-medium text-sm">{sectionLabel}</span>}
				</td>
				<td className="w-0 py-2 pr-3 align-top">
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
				<td className="py-2 pr-3 align-top text-sm">
					<span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
						{rule.titleKo}
						<code className="inline-block whitespace-nowrap rounded bg-neutral-500/10 px-2 py-0.5 font-mono text-muted-foreground text-xs">
							{rule.key}
						</code>
						{!rule.inCatalog && (
							<span className="rounded bg-violet-500/10 px-1 text-[10px] text-violet-600 dark:text-violet-400">
								신규
							</span>
						)}
					</span>
				</td>
				{/* 상태: PASS / FAIL / 미개발 / 검수 중 / 검수 전(빈칸) */}
				<td className="w-0 py-2 pr-3 align-top">
					{!implemented ? (
						<span className="inline-block whitespace-nowrap rounded bg-neutral-500/10 px-1.5 py-0.5 text-[11px] text-muted-foreground">
							개발 중
						</span>
					) : outcome ? (
						<span
							className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 font-medium text-[11px] ${STATUS[outcome.status].cls}`}
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
				<td className="w-0 py-2 text-right align-top">
					{hasDetail && (
						<button
							type="button"
							onClick={() => setOpen((value) => !value)}
							className="whitespace-nowrap text-muted-foreground text-xs hover:text-foreground"
						>
							{open ? '닫기' : '상세'}
						</button>
					)}
				</td>
			</tr>
			{open && hasDetail && (
				<tr className="border-neutral-200 border-b bg-neutral-500/[0.03] dark:border-neutral-800">
					<td />
					<td />
					<td colSpan={3} className="py-3 pr-3">
						{commentary ? (
							<p className="mb-2 text-foreground text-sm leading-6">{commentary}</p>
						) : (
							outcome?.detail && (
								<p className="mb-2 text-foreground text-xs leading-5">
									검수: {outcome.detail}
								</p>
							)
						)}
						{commentary && outcome?.detail && (
							<p className="mb-2 font-mono text-[11px] text-muted-foreground/80 leading-5">
								{outcome.detail}
							</p>
						)}
						{rule.evidence && (
							<p className="text-muted-foreground text-xs leading-5">
								{rule.evidence}
							</p>
						)}
						{rule.value && (
							<p className="mt-2 font-mono text-[11px] text-muted-foreground/80 leading-5">
								{rule.value}
							</p>
						)}
					</td>
				</tr>
			)}
		</>
	)
}

/**
 * 단일 review 페이지: 전 챕터›섹션›룰을 하나의 테이블로 렌더한다.
 * 섹션명은 헤더가 아니라 각 섹션 첫 행의 맨 왼쪽 셀에 표기하고, 그 행이 nav 앵커(#slug) 타깃이다.
 * 미구현(체커 없는) 룰은 숨김 토글이 켜져 있으면 행 자체를 만들지 않는다.
 */
/** 섹션명·앵커는 각 섹션의 첫 등장 행에만 싣는다 (필터 후에도 첫 행이 앵커가 되도록 렌더 시점에 계산). */
function withSectionLabels(
	entries: { rule: Rule; sectionSlug: string; label: string }[],
): RuleRowData[] {
	const seen = new Set<string>()
	return entries.map((entry) => {
		const first = !seen.has(entry.sectionSlug)
		seen.add(entry.sectionSlug)
		return {
			rule: entry.rule,
			sectionSlug: entry.sectionSlug,
			sectionLabel: first ? entry.label : null,
			anchorId: first ? entry.sectionSlug : null,
		}
	})
}

export function ReviewSections({ chapters }: { chapters: ReviewContentChapter[] }) {
	const { hideUnimplemented, selected } = useReviewImages()
	const [showFailOnly, setShowFailOnly] = useState(false)

	const entries: { rule: Rule; sectionSlug: string; label: string }[] = []
	for (const chapter of chapters) {
		for (const section of chapter.sections) {
			const visibleRules = section.pages
				.flatMap((page) => page.rules)
				.filter((rule) => getChecker(rule.key) !== null || !hideUnimplemented)
			for (const rule of visibleRules) {
				entries.push({
					rule,
					sectionSlug: section.slug,
					label: `${chapter.code}. ${section.name}`,
				})
			}
		}
	}

	// 요약 카운트는 필터·숨김과 무관하게 구현된 룰 전체 기준으로 집계한다.
	const results = selected?.results
	let pass = 0
	let fail = 0
	let pendingReview = 0
	for (const chapter of chapters) {
		for (const section of chapter.sections) {
			for (const page of section.pages) {
				for (const rule of page.rules) {
					if (getChecker(rule.key) === null) continue
					const status = results?.[rule.key]?.status
					if (status === 'pass') pass++
					else if (status === 'fail') fail++
					else pendingReview++
				}
			}
		}
	}
	const reviewed = pass + fail > 0

	const visibleEntries =
		showFailOnly && results
			? entries.filter((entry) => results[entry.rule.key]?.status === 'fail')
			: entries
	const rows = withSectionLabels(visibleEntries)

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
				<table className="w-full border-collapse">
					<tbody>
						{rows.map((row) => (
							<RuleRow
								key={`${row.sectionSlug}-${row.rule.key}`}
								rule={row.rule}
								sectionLabel={row.sectionLabel}
								anchorId={row.anchorId}
							/>
						))}
					</tbody>
				</table>
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
