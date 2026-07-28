import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const typographyVariants = cva('', {
	variants: {
		family: {
			body: 'font-body',
			title: 'font-title',
		},
		size: {
			xs: 'text-xs',
			sm: 'text-sm',
			base: 'text-base',
			xl: 'text-xl',
			'2xl': 'text-2xl',
			'5xl': 'text-5xl',
			'6xl': 'text-6xl',
		},
		tone: {
			inherit: null,
			muted: 'text-muted-foreground',
			destructive: 'text-destructive',
		},
		weight: {
			normal: 'font-normal',
			medium: 'font-medium',
			semibold: 'font-semibold',
			bold: 'font-bold',
		},
	},
	defaultVariants: {
		family: 'body',
		size: 'base',
		tone: 'inherit',
		weight: 'normal',
	},
})

type TypographyElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'small' | 'span'

type TypographyProps = React.HTMLAttributes<HTMLElement> &
	VariantProps<typeof typographyVariants> & {
		as?: TypographyElement
	}

function Typography({
	as = 'p',
	className,
	family = 'body',
	size = 'base',
	tone = 'inherit',
	weight = 'normal',
	...props
}: TypographyProps) {
	const Comp: React.ElementType = as

	return (
		<Comp
			data-slot="typography"
			data-size={size}
			className={cn(typographyVariants({ family, size, tone, weight }), className)}
			{...props}
		/>
	)
}

export { Typography }
