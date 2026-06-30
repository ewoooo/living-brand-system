'use client'

import { MagicWand, Ruler, User } from '@carbon/icons-react'
import { type ComponentType, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReviewImages } from '@/features/review/image-context'

interface Rule {
	key: string
	title: string
	titleKo: string
	tier: string
	inCatalog: boolean
	evidence: string
	value: string
}

interface ReviewPage {
	page: number
	rules: Rule[]
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
	pass: { label: '통과', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
	fail: { label: '미통과', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' },
	pending: { label: '미개발', cls: 'bg-neutral-500/10 text-muted-foreground' },
}

function RuleRow({ rule }: { rule: Rule }) {
	const [open, setOpen] = useState(false)
	const { selected } = useReviewImages()
	const tier = TIER[rule.tier] ?? { label: rule.tier, Icon: User, desc: '' }
	const TierIcon = tier.Icon

	const outcome = selected?.results?.[rule.key]
	// outcome 있으면 결과(통과/미통과/미개발), 없는데 검수 중이면 진행 bar, 이미지 없으면 미검수
	const inProgress = Boolean(selected?.checking) && !outcome

	const hasDetail = Boolean(rule.evidence || rule.value || outcome?.detail)

	return (
		<>
			<tr className="border-neutral-200 border-b transition-colors hover:bg-neutral-500/5 dark:border-neutral-800">
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
				<td className="w-0 py-2 pr-3 align-top">
					{outcome ? (
						<span
							className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] ${STATUS[outcome.status].cls}`}
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

export function RuleTables({ pages }: { pages: ReviewPage[] }) {
	const { selected } = useReviewImages()
	const allRules = pages.flatMap((page) => page.rules)
	const counts = { pass: 0, fail: 0, pending: 0 }
	if (selected) {
		for (const rule of allRules) {
			const outcome = selected.results?.[rule.key]
			if (outcome) counts[outcome.status] += 1
			else counts.pending += 1
		}
	}

	return (
		<TooltipProvider delayDuration={150}>
			<div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
				{selected ? (
					<>
						<span className="font-medium">{selected.name}</span>
						<span className="text-emerald-600 dark:text-emerald-400">
							통과 {counts.pass}
						</span>
						<span className="text-rose-600 dark:text-rose-400">
							미통과 {counts.fail}
						</span>
						<span className="text-muted-foreground">미개발 {counts.pending}</span>
					</>
				) : (
					<span className="text-muted-foreground">
						이미지를 올리면 이 섹션 검수가 시작됩니다.
					</span>
				)}
			</div>
			<div className="flex flex-col gap-10">
				{pages.map((page) => (
					<section key={page.page}>
						<div className="mb-1.5 text-muted-foreground/70 text-xs tabular-nums">
							p{page.page}
						</div>
						<table className="w-full border-collapse">
							<tbody>
								{page.rules.map((rule) => (
									<RuleRow key={`${page.page}-${rule.key}`} rule={rule} />
								))}
							</tbody>
						</table>
					</section>
				))}
			</div>
		</TooltipProvider>
	)
}
