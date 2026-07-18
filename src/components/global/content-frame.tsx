import type * as React from 'react'
import { cn } from '@/lib/utils'

/** 페이지 공통 가로 프레임. 최대 폭과 가로 여백만 소유하고 세로 간격은 호출자가 정한다. */
export function ContentFrame({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="content-frame"
			className={cn('mx-auto w-full max-w-[1250px] px-4 md:px-8', className)}
			{...props}
		/>
	)
}
