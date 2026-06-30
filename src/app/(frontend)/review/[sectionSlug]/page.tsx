import { notFound } from 'next/navigation'
import { getReviewSection } from '@/features/review/navigation'

const TIER_DOT: Record<string, string> = {
	automated: 'bg-emerald-500',
	assisted: 'bg-amber-500',
	manual: 'bg-rose-500',
}

export default async function ReviewSectionPage({
	params,
}: {
	params: Promise<{ sectionSlug: string }>
}) {
	const { sectionSlug } = await params
	const section = getReviewSection(sectionSlug)

	if (!section) {
		notFound()
	}

	const ruleCount = section.pages.reduce((sum, page) => sum + page.rules.length, 0)

	return (
		<article className="grid w-full grid-rows-[auto_1fr] px-8 py-10">
			<header className="mb-10">
				<p className="text-muted-foreground text-sm">
					{section.chapter}. {section.chapterName}
				</p>
				<h1 className="text-5xl">{section.name}</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					p{section.startPage}–{section.endPage} · {ruleCount}룰
				</p>
			</header>
			<section className="flex flex-col gap-16">
				{section.pages.map((page) => (
					<article key={page.page} id={`p${page.page}`} className="scroll-mt-6">
						<h2 className="mb-4 font-semibold text-muted-foreground text-sm">Page {page.page}</h2>
						<ul className="space-y-4">
							{page.rules.map((rule, index) => (
								<li key={`${rule.key}-${index}`} className="flex gap-3">
									<span
										className={`mt-1.5 size-2 shrink-0 rounded-full ${TIER_DOT[rule.tier] || 'bg-neutral-400'}`}
										title={rule.tier}
									/>
									<div className="min-w-0">
										<div className="flex flex-wrap items-baseline gap-x-2">
											<code className="font-mono text-sm">{rule.key}</code>
											{!rule.inCatalog && (
												<span className="rounded bg-violet-500/10 px-1.5 text-[11px] text-violet-600 dark:text-violet-400">
													신규
												</span>
											)}
											<span className="text-sm">{rule.title}</span>
										</div>
										{rule.evidence && (
											<p className="mt-1 text-muted-foreground text-xs leading-5">{rule.evidence}</p>
										)}
										{rule.value && (
											<p className="mt-1 font-mono text-[11px] text-muted-foreground/80">
												{rule.value}
											</p>
										)}
									</div>
								</li>
							))}
						</ul>
					</article>
				))}
			</section>
		</article>
	)
}
