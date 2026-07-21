import type * as React from 'react'
import { cn } from '@/lib/utils'

export type GuidelineContentFrameVariant = 'padded' | 'full'

type GuidelineContentFrameProps = React.ComponentProps<'div'> & {
	variant?: GuidelineContentFrameVariant
}

/** 가이드라인 페이지 공통 가로 프레임. 최대 폭과 가로 여백만 소유한다. */
export function GuidelineContentFrame({
	variant = 'padded',
	className,
	...props
}: GuidelineContentFrameProps) {
	return (
		<div
			data-slot="guideline-content-frame"
			data-variant={variant}
			className={cn(
				'w-full py-16',
				variant === 'padded' && 'mx-auto max-w-[1250px] px-4 md:px-8',
				className,
			)}
			{...props}
		/>
	)
}
