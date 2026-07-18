import { Typography } from '@/components/ui/typography'

/**
 * Studio 최상위 화면의 문서 outline과 타이포그래피를 통일한다.
 * eyebrow는 독립 섹션이 아니므로 heading으로 렌더하지 않는다.
 */
export function PageHeader({
	eyebrow,
	title,
	description,
}: {
	eyebrow?: string
	title: string
	description?: string
}) {
	return (
		<header className="flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				{eyebrow && (
					<Typography as="p" size="xl" tone="muted">
						{eyebrow}
					</Typography>
				)}
				<Typography as="h1" family="title" size="4xl">
					{title}
				</Typography>
			</div>
			{description && <Typography tone="muted">{description}</Typography>}
		</header>
	)
}
