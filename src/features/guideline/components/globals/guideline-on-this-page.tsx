// Carbon AnchorLinks 대응: 섹션 내 페이지(앵커)로 점프하는 "이 페이지에서" 목차.
// 데이터 비결합 — {slug,title} 목록만 있으면 렌더한다. 항목이 1개 이하면 렌더하지 않는다.
export function GuidelineOnThisPage({
	pages,
}: {
	pages: { slug: string; title?: string | null }[]
}) {
	const items = pages.filter((page) => page.title)
	if (items.length < 2) return null

	return (
		<nav aria-label="On this page" className="mb-12">
			<p className="type-caption-1-emphasized mb-3 text-foreground-muted uppercase tracking-wide">
				On this page
			</p>
			<ul className="flex flex-col border-scrim/10 border-l">
				{items.map((page) => (
					<li key={page.slug}>
						<a
							href={`#${page.slug}`}
							className="type-body -ml-px block border-transparent border-l-2 py-1.5 pl-4 text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
						>
							{page.title}
						</a>
					</li>
				))}
			</ul>
		</nav>
	)
}
