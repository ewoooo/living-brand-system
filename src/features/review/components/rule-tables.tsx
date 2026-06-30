'use client'

import { MagicWand, Ruler, User } from '@carbon/icons-react'
import { type ComponentType, useState } from 'react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useReviewImages } from '@/features/review/image-context'

interface Rule {
	key: string
	title: string
	tier: string
	inCatalog: boolean
	evidence: string
	value: string
}

interface ReviewPage {
	page: number
	rules: Rule[]
}

const TIER: Record<string, { label: string; Icon: ComponentType<{ size?: number }>; desc: string }> = {
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
	// 이미지 미선택 → 미검수(null) / checker 있음 → pass·fail / checker 없음 → pending(미개발)
	const reviewStatus = !selected ? null : outcome ? outcome.status : 'pending'

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
							{tier.desc && <span className="block text-xs opacity-80">{tier.desc}</span>}
						</TooltipContent>
					</Tooltip>
				</td>
				<td className="py-2 pr-4 align-top text-sm">{rule.title}</td>
				<td className="w-0 py-2 pr-3 align-top">
					<code className="inline-block whitespace-nowrap rounded bg-neutral-500/10 px-2 py-0.5 font-mono text-muted-foreground text-xs">
						{rule.key}
					</code>
					{!rule.inCatalog && (
						<span className="ml-1.5 rounded bg-violet-500/10 px-1 text-[10px] text-violet-600 dark:text-violet-400">
							신규
						</span>
					)}
				</td>
				<td className="w-0 py-2 pr-3 align-top">
					{reviewStatus && (
						<span
							className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] ${STATUS[reviewStatus].cls}`}
						>
							{STATUS[reviewStatus].label}
						</span>
					)}
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
					<td colSpan={4} className="py-3 pr-3">
						{outcome?.detail && (
							<p className="mb-2 text-foreground text-xs leading-5">검수: {outcome.detail}</p>
						)}
						{rule.evidence && (
							<p className="text-muted-foreground text-xs leading-5">{rule.evidence}</p>
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
	return (
		<TooltipProvider delayDuration={150}>
			<div className="flex flex-col gap-10">
				{pages.map((page) => (
					<section key={page.page}>
						<div className="mb-1.5 text-muted-foreground/70 text-xs tabular-nums">p{page.page}</div>
						<table className="w-full border-collapse">
							<tbody>
								{page.rules.map((rule, index) => (
									<RuleRow key={`${rule.key}-${index}`} rule={rule} />
								))}
							</tbody>
						</table>
					</section>
				))}
			</div>
		</TooltipProvider>
	)
}
