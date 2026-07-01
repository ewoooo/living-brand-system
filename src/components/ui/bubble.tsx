import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const bubbleVariants = cva(
	'group/bubble relative flex w-max max-w-[80%] min-w-0 flex-col gap-1 data-[align=end]:self-end',
	{
		variants: {
			variant: {
				default:
					'*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80',
				muted: '*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]',
				destructive:
					'*:data-[slot=bubble-content]:bg-destructive/10 *:data-[slot=bubble-content]:text-destructive dark:*:data-[slot=bubble-content]:bg-destructive/20 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20 dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/30',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

function Bubble({
	variant = 'default',
	align = 'start',
	className,
	...props
}: React.ComponentProps<'div'> &
	VariantProps<typeof bubbleVariants> & {
		align?: 'start' | 'end'
	}) {
	return (
		<div
			data-slot="bubble"
			data-variant={variant}
			data-align={align}
			className={cn(bubbleVariants({ variant }), className)}
			{...props}
		/>
	)
}

function BubbleContent({
	asChild = false,
	className,
	...props
}: React.ComponentProps<'div'> & {
	asChild?: boolean
}) {
	const Comp = asChild ? Slot.Root : 'div'

	return (
		<Comp
			data-slot="bubble-content"
			className={cn(
				'w-full max-w-full min-w-0 overflow-hidden rounded-4xl border border-transparent px-3.5 py-1.5 text-xs/relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-2 [button,a]:focus-visible:ring-ring/30',
				className,
			)}
			{...props}
		/>
	)
}

export { Bubble, BubbleContent }
