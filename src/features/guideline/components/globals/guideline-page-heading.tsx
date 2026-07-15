// page(하위) 헤더 — section 헤더(sticky 히어로)와 완전히 별개 컴포넌트.
// 검정 박스/히어로 없음. 앞 콘텐츠와 구분하는 상단 divider + 번호 eyebrow + 섹션보다 작은 제목.
export function GuidelinePageHeading({ title, label }: { title: string; label?: string | number }) {
	return (
		<header className="mb-8 border-scrim/10 border-t pt-12">
			{label !== undefined && <p className="type-body -mb-1 text-foreground-muted">{label}</p>}
			<h2 className="type-title-1 text-foreground">{title}</h2>
		</header>
	)
}
