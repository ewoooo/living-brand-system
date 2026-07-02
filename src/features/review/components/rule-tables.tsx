'use client'

import { MagicWand, Ruler, User } from '@carbon/icons-react'
import { type ComponentType, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getChecker } from '@/features/review/checkers/registry'
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
						{outcome?.detail && (
							<p className="mb-2 text-foreground text-xs leading-5">
								검수: {outcome.detail}
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
export function ReviewSections({ chapters }: { chapters: ReviewContentChapter[] }) {
	const { hideUnimplemented } = useReviewImages()

	const rows: RuleRowData[] = []
	for (const chapter of chapters) {
		for (const section of chapter.sections) {
			const visibleRules = section.pages
				.flatMap((page) => page.rules)
				.filter((rule) => getChecker(rule.key) !== null || !hideUnimplemented)
			visibleRules.forEach((rule, index) => {
				rows.push({
					rule,
					sectionSlug: section.slug,
					sectionLabel: index === 0 ? `${chapter.code}. ${section.name}` : null,
					anchorId: index === 0 ? section.slug : null,
				})
			})
		}
	}

	return (
		<TooltipProvider delayDuration={150}>
			<div className="px-8 py-8">
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
			</div>
		</TooltipProvider>
	)
}
