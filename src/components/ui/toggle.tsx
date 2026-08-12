'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Toggle as TogglePrimitive } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// 🔴 선택 상태는 `muted`로 칠하면 안 된다 — 이 테마에서 `--accent`와 `--muted`가 같은 값이고
//    hover도 `bg-muted`라, 선택된 항목과 그냥 커서를 올린 항목이 똑같이 생긴다. 그래서 호출부마다
//    자기 방식으로 on-state를 덮어 왔다(segmented·theme-toggle·icon-grid가 서로 다른 셋). 채워진
//    상태는 `primary` 짝으로 통일한다 — Slider의 채움도 `bg-primary`라 "값이 든 자리"의 어휘가 같아진다.
//    hover까지 눌러 두지 않으면 선택된 항목에 커서를 올릴 때 muted로 되돌아 선택이 풀린 것처럼 보인다.
const toggleVariants = cva(
	"group/toggle inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default: 'bg-transparent',
				outline: 'border border-input bg-transparent hover:bg-muted',
			},
			size: {
				default:
					'h-8 min-w-8 px-2 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
				sm: "h-7 min-w-7 rounded-[min(var(--radius-md),8px)] px-2 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
				lg: "h-9 min-w-9 px-2.5 text-base has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-5",
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

function Toggle({
	className,
	variant = 'default',
	size = 'default',
	...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
	return (
		<TogglePrimitive.Root
			data-slot="toggle"
			className={cn(toggleVariants({ variant, size, className }))}
			{...props}
		/>
	)
}

export { Toggle, toggleVariants }
