import { Information } from '@carbon/icons-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

/**
 * Studio 최상위 화면의 문서 outline과 타이포그래피를 통일한다.
 * eyebrow는 독립 섹션이 아니므로 heading으로 렌더하지 않는다.
 */
export function PageHeader({
	tail,
	title,
	description,
	tip,
	className,
}: {
	tail?: React.ReactNode
	title: string
	description?: string
	tip?: string
	className?: string
}) {
	return (
		<header className={cn('flex justify-between gap-4', className)}>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-1">
					<Typography as="h1" family="body" size="4xl">
						{title}
					</Typography>
					{tip && <HeaderTip title={title} tip={tip} />}
				</div>
				{description && <Typography tone="muted">{description}</Typography>}
			</div>
			{tail}
		</header>
	)
}

function HeaderTip({ title, tip }: { title: string; tip?: string }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="muted"
					shape="pill"
					size="icon-sm"
					aria-label={`${title} 안내`}
				>
					<Information className="size-4" aria-hidden />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right" align="start" sideOffset={8}>
				{tip}
			</TooltipContent>
		</Tooltip>
	)
}
