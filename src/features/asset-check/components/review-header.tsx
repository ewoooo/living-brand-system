/**
 * 검수 화면 페이지 헤더.
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
