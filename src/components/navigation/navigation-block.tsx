import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

const navigationBlockVariants = cva(
	'group flex h-full w-full flex-col border outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
	{
		variants: {
			variant: {
				featured: 'bg-foreground p-6 text-background hover:opacity-60',
				prominent: 'border-border bg-background p-6 hover:bg-accent',
				default: 'border-border bg-background p-4 hover:bg-accent',
				compact: 'border-border bg-background p-3 hover:bg-accent',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

const labelSize = {
	featured: '6xl',
	prominent: '5xl',
	default: '2xl',
	compact: 'base',
} as const

const tailPadding = {
	featured: 'pt-6',
	prominent: 'pt-6',
	default: 'pt-4',
	compact: 'pt-3',
} as const

export function NavigationBlock({
	variant,
	href,
	label,
	description,
	tail,
	className,
}: VariantProps<typeof navigationBlockVariants> & {
	href: string
	label: string
	description?: string | null
	tail?: ReactNode
	className?: string
}) {
	const resolvedVariant = variant ?? 'default'

	return (
		<Link
			data-slot="navigation-block"
			data-variant={resolvedVariant}
			href={href}
			className={cn(navigationBlockVariants({ variant }), className)}
		>
			<hgroup>
				<Typography
					as={resolvedVariant === 'featured' ? 'span' : 'h3'}
					size={labelSize[resolvedVariant]}
					className={cn(resolvedVariant === 'featured' && 'leading-none font-light')}
				>
					{label}
				</Typography>
				{description && (
					<Typography
						size="sm"
						tone="muted"
						className={cn(
							'mt-3',
							resolvedVariant === 'featured' && 'text-background/70',
						)}
					>
						{description}
					</Typography>
				)}
			</hgroup>
			{tail && (
				<div className={cn('mt-auto flex items-center', tailPadding[resolvedVariant])}>
					{tail}
				</div>
			)}
		</Link>
	)
}
