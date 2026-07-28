import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
	"group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent px-1 py-0.5 text-xs font-normal whitespace-nowrap outline-none transition-[color,box-shadow,background-color,border-color] has-data-[icon=only]:size-5 has-data-[icon=only]:p-0 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-3.5",
	{
		variants: {
			variant: {
				outline: 'border-foreground bg-transparent text-foreground [a&]:hover:bg-muted',
				tint: 'border-primary/40 bg-primary/10 text-foreground [a&]:hover:bg-primary/15',
				muted: 'bg-muted text-muted-foreground [a&]:hover:bg-muted/80',
				highlight: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/80',
			},
			shape: {
				sharp: 'rounded-none',
				rounded: 'rounded-sm',
				pill: 'rounded-full px-1.5',
			},
		},
		defaultVariants: {
			variant: 'muted',
			shape: 'pill',
		},
	},
)

function Badge({
	className,
	variant = 'muted',
	shape = 'pill',
	asChild = false,
	...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : 'span'

	return (
		<Comp
			data-slot="badge"
			data-variant={variant}
			data-shape={shape}
			className={cn(badgeVariants({ variant, shape }), className)}
			{...props}
		/>
	)
}

export { Badge, badgeVariants }
