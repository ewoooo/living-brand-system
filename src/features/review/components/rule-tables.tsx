'use client'

import { MagicWand, Ruler, User } from '@carbon/icons-react'
import { type ComponentType, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getChecker } from '@/features/review/checkers/registry'
import { useReviewImages } from '@/features/review/image-context'
import type { getReviewContent } from '@/features/review/navigation'

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
	const { selected, hideUnimplemented } = useReviewImages()
	// 미구현 = 체커가 등록되지 않은 룰. 기본은 숨기고, 표시할 땐 [개발 중]으로 흐리게(상세는 작동).
	const implemented = getChecker(rule.key) !== null
	if (!implemented && hideUnimplemented) return null

	const tier = TIER[rule.tier] ?? { label: rule.tier, Icon: User, desc: '' }
	const TierIcon = tier.Icon

	const outcome = selected?.results?.[rule.key]
	const inProgress = Boolean(selected?.checking) && !outcome
	const hasDetail = Boolean(rule.evidence || rule.value || outcome?.detail)

	return (
		<>
			<tr
				className={`border-neutral-200 border-b transition-colors hover:bg-neutral-500/5 dark:border-neutral-800 ${
					implemented ? '' : 'opacity-45'
				}`}
			>
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
					{!implemented ? (
						<span className="inline-block whitespace-nowrap rounded bg-neutral-500/10 px-1.5 py-0.5 text-[11px] text-muted-foreground">
							개발 중
						</span>
					) : outcome ? (
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

/**
 * 단일 review 페이지: 전 챕터›섹션›페이지›룰을 한 페이지에 렌더한다.
 * 각 섹션은 nav 앵커 타깃(#slug). 보이는 룰이 없는 섹션은 숨기되 앵커 스텁은 남긴다.
 * 섹션 게이팅(콘텐츠 플래그 기반 비활성)은 제거됨 — 모든 섹션을 항상 표시한다.
 */
export function ReviewSections({ chapters }: { chapters: ReviewContentChapter[] }) {
	const { hideUnimplemented } = useReviewImages()

	return (
		<TooltipProvider delayDuration={150}>
			<div className="flex flex-col gap-12 px-8 py-8">
				{chapters.flatMap((chapter) =>
					chapter.sections.map((section) => {
						const visiblePages = section.pages.filter((page) =>
							page.rules.some(
								(rule) => getChecker(rule.key) !== null || !hideUnimplemented,
							),
						)
						// 보이는 룰이 없으면 섹션은 숨기고, nav 앵커가 향할 빈 스텁만 남긴다.
						if (visiblePages.length === 0) {
							return <section key={section.slug} id={section.slug} />
						}
						return (
							<section key={section.slug} id={section.slug} className="scroll-mt-72">
								<h2 className="mb-6 font-semibold text-xl">
									<span className="text-muted-foreground">{chapter.code}.</span>{' '}
									{section.name}
								</h2>
								<div className="flex flex-col gap-10">
									{visiblePages.map((page) => (
										<div key={page.page}>
											<div className="mb-1.5 text-muted-foreground/70 text-xs tabular-nums">
												p{page.page}
											</div>
											<table className="w-full border-collapse">
												<tbody>
													{page.rules.map((rule) => (
														<RuleRow
															key={`${page.page}-${rule.key}`}
															rule={rule}
														/>
													))}
												</tbody>
											</table>
										</div>
									))}
								</div>
							</section>
						)
					}),
				)}
			</div>
		</TooltipProvider>
	)
}
