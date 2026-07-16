/**
 * 검수 영역 페이지 헤더 — /review와 /review/rules가 공유한다.
 * in : { title: string; description?: string }
 */
export function ReviewHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div>
			<h1 className="type-large-title pb-4">{title}</h1>
			{description && <p className="type-body pl-2 text-foreground-muted">{description}</p>}
		</div>
	)
}
