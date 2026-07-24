import { ArrowRight } from '@carbon/icons-react'
import { cva } from 'class-variance-authority'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

const navigationBlockVariants = cva(
	'group w-full p-6 outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
	{
		variants: {
			variant: {
				hero: 'block bg-foreground text-background hover:opacity-60',
				onboard:
					'flex aspect-[2/1] flex-col border-border border-r border-b bg-background hover:bg-accent',
				section:
					'flex aspect-[2/1] flex-col border-border border-r border-b bg-background hover:bg-accent',
			},
			ratio: {
				square: 'aspect-square',
				portrait: 'aspect-square md:h-full md:aspect-auto',
				landscape: 'aspect-square md:aspect-[2/1]',
				fill: 'h-full',
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
	ratio = variant === 'hero' ? 'square' : undefined,
}: {
	variant: 'hero' | 'onboard' | 'section'
	href: string
	label: string
	description?: string | null
	showChevron?: boolean
	icon?: ReactNode
	className?: string
	ratio?: 'square' | 'portrait' | 'landscape' | 'fill'
}) {
	const hasFooter = icon !== undefined || showChevron

	return (
		<Link
			data-slot="navigation-block"
			data-variant={variant}
			data-ratio={ratio}
			href={href}
			className={navigationBlockVariants({ ratio, variant })}
		>
			<div>
				<Typography
					as={variant === 'hero' ? 'span' : 'h3'}
					size="2xl"
					className={cn(
						variant === 'hero' && 'text-6xl leading-none font-light',
						className,
					)}
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
			</div>
			{hasFooter && (
				<div className="mt-auto flex items-center pt-6">
					{icon}
					{showChevron && <ArrowRight aria-hidden className="ml-auto" size={24} />}
				</div>
			)}
		</Link>
	)
}
