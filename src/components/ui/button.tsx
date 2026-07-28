import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				highlight: 'bg-highlight text-highlight-foreground hover:brightness-95',
				outline:
					'border-foreground bg-transparent text-foreground hover:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground',
				tint: 'border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15',
				muted: 'bg-muted text-muted-foreground hover:bg-muted/80',
				ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 dark:focus-visible:bg-muted/50',
				destructive:
					'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			shape: {
				sharp: 'rounded-none',
				rounded: 'rounded-md',
				pill: 'rounded-full',
			},
			size: {
				default:
					"h-8 gap-1 px-2 text-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
				xs: "h-6 gap-1 px-2 text-sm leading-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
				sm: "h-7 gap-1 px-2 text-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
				lg: "h-9 gap-1.5 px-3 text-base has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-5",
				icon: "size-8 [&_svg:not([class*='size-'])]:size-4",
				'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-4",
				'icon-sm': "size-7 [&_svg:not([class*='size-'])]:size-4",
				'icon-lg': "size-9 [&_svg:not([class*='size-'])]:size-5",
			},
		},
		defaultVariants: {
			variant: 'highlight',
			shape: 'rounded',
			size: 'default',
		},
	},
)

function Button({
	className,
	variant = 'highlight',
	shape = 'rounded',
	size = 'default',
	asChild = false,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot.Root : 'button'

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-shape={shape}
			data-size={size}
			className={cn(buttonVariants({ variant, shape, size, className }))}
			{...props}
		/>
	)
}

export { Button, buttonVariants }
