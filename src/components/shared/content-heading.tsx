import { Information } from '@carbon/icons-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'

const HEADING_TAG = {
	1: 'h1',
	2: 'h2',
	3: 'h3',
} as const

export function ContentHeading({
	title,
	description,
	helpText,
	level = 1,
	family = 'body',
	size = '5xl',
	weight = 'normal',
	className,
	titleClassName,
}: {
	title: string
	description?: string
	helpText?: string
	level?: keyof typeof HEADING_TAG
	family?: 'body' | 'title'
	size?: 'xs' | 'sm' | 'base' | 'xl' | '2xl' | '5xl' | '6xl'
	weight?: 'normal' | 'medium' | 'semibold' | 'bold'
	className?: string
	titleClassName?: string
}) {
	const headingTag = HEADING_TAG[level]

	return (
		<header data-slot="content-heading" data-level={level} className={className}>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-1">
					<Typography
						as={headingTag}
						family={family}
						size={size}
						weight={weight}
						className={titleClassName}
					>
						{title}
					</Typography>
					{helpText && <HeadingHelp title={title} helpText={helpText} />}
				</div>
				{description && (
					<Typography size="xl" tone="muted">
						{description}
					</Typography>
				)}
			</div>
		</header>
	)
}

function HeadingHelp({ title, helpText }: { title: string; helpText: string }) {
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
				{helpText}
			</TooltipContent>
		</Tooltip>
	)
}
