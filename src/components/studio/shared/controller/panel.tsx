'use client'

import type * as React from 'react'
import { cn } from '@/lib/utils'

type ControllerPanelProps = {
	/** 스크롤 영역 아래 고정되는 꼬리(설정·CTA). */
	footer?: React.ReactNode
	className?: string
	children: React.ReactNode
}

/** 둥근 카드 패널 — 본문은 스크롤, footer는 하단 고정. */
export function ControllerPanel({ footer, className, children }: ControllerPanelProps) {
	return (
		<div
			data-slot="controller-panel"
			className={cn(
				'flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg lg:h-full',
				className,
			)}
		>
			<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">{children}</div>
			{footer && (
				<div className="flex shrink-0 flex-col gap-4 border-t border-border px-4 pt-1 pb-4">
					{footer}
				</div>
			)}
		</div>
	)
}
