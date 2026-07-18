// page(하위) 헤더 — section 헤더(sticky top-0, 76px 바) 아래에 붙어서 sticky(top-[76px]).
// 소제목이므로 섹션보다 작지만 굵고 크게. 번호 eyebrow + 제목.
export function GuidelinePageHeading({ title, label }: { title: string; label?: string | number }) {
	return (
		<header className="sticky top-0 z-20 mb-6 flex items-start gap-1 bg-background pt-3 pb-3">
			{label !== undefined && (
				<p className="-mb-1 font-body font-normal text-base text-muted-foreground">
					{label}
				</p>
			)}
			<h2 className="font-title text-4xl text-foreground leading-none">{title}</h2>
		</header>
	)
}
