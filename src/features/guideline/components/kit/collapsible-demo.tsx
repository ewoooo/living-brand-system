'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

/**
 * kit 실험 보드의 컴포넌트 카드 — 헤더(제목 + 슬라이딩 토글)와 접히는 본문.
 * 토글을 끄면 본문을 감춰 원하는 컴포넌트만 보게 한다. 모든 컴포넌트를 동등하게 감싼다.
 *
 * @example
 * <CollapsibleDemo title="Carousel">{children}</CollapsibleDemo>
 */
export function CollapsibleDemo({
	title,
	children,
	defaultOpen = true,
}: {
	title: string
	children: ReactNode
	defaultOpen?: boolean
}) {
	const [open, setOpen] = useState(defaultOpen)

	return (
		<section className="border-border border-b pb-10 last:border-b-0">
			<header className="mb-5 flex items-center justify-between gap-4">
				<h3 className="font-body font-medium text-muted-foreground text-xs uppercase tracking-wide">
					{title}
				</h3>
				{/* 슬라이딩 토글 — 켜짐=본문 표시, 꺼짐=접힘 */}
				<button
					type="button"
					aria-pressed={open}
					aria-label={`${title} ${open ? '접기' : '펼치기'}`}
					onClick={() => setOpen((value) => !value)}
					className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
						open ? 'bg-foreground' : 'bg-border'
					}`}
				>
					<span
						className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
							open ? 'translate-x-4' : ''
						}`}
					/>
				</button>
			</header>
			{open && children}
		</section>
	)
}
