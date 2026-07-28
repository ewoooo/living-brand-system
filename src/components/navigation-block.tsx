import { cva } from 'class-variance-authority'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

const navigationBlockVariants = cva(
	'group flex h-full w-full flex-col border outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
	{
		variants: {
			variant: {
				xl: 'bg-foreground p-6 text-background hover:opacity-60',
				lg: 'border-border bg-background p-6 hover:bg-accent',
				md: 'border-border bg-background p-4 hover:bg-accent',
				sm: 'border-border bg-background p-3 hover:bg-accent',
			},
		},
	},
)

const labelSize = {
	xl: '6xl',
	lg: '4xl',
	md: '2xl',
	sm: 'lg',
} as const

const tailPadding = {
	xl: 'pt-6',
	lg: 'pt-6',
	md: 'pt-4',
	sm: 'pt-3',
} as const

export function NavigationBlock({
	variant,
	href,
	label,
	description,
	tail,
	className,
}: {
	variant: 'xl' | 'lg' | 'md' | 'sm'
	href: string
	label: string
	description?: string | null
	tail?: ReactNode
	className?: string
}) {
	return (
		<Link
			data-slot="navigation-block"
			data-variant={variant}
			href={href}
			className={cn(navigationBlockVariants({ variant }), className)}
		>
			<hgroup>
				<Typography
					as={variant === 'xl' ? 'span' : 'h3'}
					size={labelSize[variant]}
					className={cn(variant === 'xl' && 'leading-none font-light')}
				>
					{label}
				</Typography>
				{description && (
					<Typography
						size="sm"
						tone="muted"
						className={cn('mt-3', variant === 'xl' && 'text-background/70')}
					>
						{description}
					</Typography>
				)}
			</hgroup>
			{tail && (
				<div className={cn('mt-auto flex items-center', tailPadding[variant])}>{tail}</div>
			)}
		</Link>
	)
}
