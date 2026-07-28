import { ArrowRight } from '@carbon/icons-react'
import { cva } from 'class-variance-authority'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

const navigationBlockVariants = cva(
	'group flex h-full w-full flex-col p-6 outline-none border transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
	{
		variants: {
			variant: {
				hero: 'bg-foreground text-background hover:opacity-60',
				onboard: 'border-border bg-background hover:bg-accent',
				section: 'border-border bg-background hover:bg-accent',
			},
		},
	},
)

export function NavigationBlock({
	variant,
	href,
	label,
	description,
	showChevron = variant !== 'hero',
	icon,
	className,
}: {
	variant: 'hero' | 'onboard' | 'section'
	href: string
	label: string
	description?: string | null
	showChevron?: boolean
	icon?: ReactNode
	className?: string
}) {
	const hasFooter = icon !== undefined || showChevron

	return (
		<Link
			data-slot="navigation-block"
			data-variant={variant}
			href={href}
			className={cn(navigationBlockVariants({ variant }), className)}
		>
			<hgroup>
				<Typography
					as={variant === 'hero' ? 'span' : 'h3'}
					size={variant === 'hero' ? '6xl' : '2xl'}
					className={cn(variant === 'hero' && 'leading-none font-light')}
				>
					{label}
				</Typography>
				{description && (
					<Typography
						size="sm"
						tone="muted"
						className={cn('mt-3', variant === 'hero' && 'text-background/70')}
					>
						{description}
					</Typography>
				)}
			</hgroup>
			{hasFooter && (
				<div className="mt-auto flex items-center pt-6">
					{icon}
					{showChevron && <ArrowRight aria-hidden className="ml-auto" size={24} />}
				</div>
			)}
		</Link>
	)
}
