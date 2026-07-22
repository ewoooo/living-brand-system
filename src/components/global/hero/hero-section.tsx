'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

const MARQUEE_ITEMS = [
	'Guideline',
	'Templates',
	'Review',
	'Generate',
	'AI Agent',
	'Brand System',
	'Design Tokens',
	'Typography',
]

export function HeroSection() {
	const marqueeRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const el = marqueeRef.current
		if (!el) return

		let frame: number
		let x = 0
		const speed = 0.4

		const tick = () => {
			x -= speed
			const half = el.scrollWidth / 2
			if (Math.abs(x) >= half) x = 0
			el.style.transform = `translateX(${x}px)`
			frame = requestAnimationFrame(tick)
		}

		frame = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(frame)
	}, [])

	return (
		<section
			aria-label="hero"
			className="relative flex flex-1 flex-col overflow-hidden"
		>
			{/* Grid lines — decorative */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 grid grid-cols-4 opacity-[0.04] dark:opacity-[0.06]"
			>
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="border-r border-foreground last:border-r-0"
						style={{ gridColumn: i + 1 }}
					/>
				))}
			</div>

			{/* Main content — vertically centered */}
			<div className="relative z-10 flex flex-1 flex-col items-start justify-center px-8 sm:px-12 lg:px-16">
				{/* Eyebrow label */}
				<div className="mb-6 flex items-center gap-2">
					<span className="h-px w-8 bg-foreground/30" />
					<span className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
						[ introducing ]
					</span>
				</div>

				{/* Headline */}
				<hgroup className="max-w-5xl">
					<h1 className="font-title text-[clamp(3rem,8vw,7rem)] font-normal leading-[0.92] tracking-tight text-foreground">
						Living
						<br />
						<span className="text-foreground/20">Brand</span>
						<br />
						System
					</h1>
					<p className="mt-8 max-w-md font-body text-base font-normal leading-relaxed text-muted-foreground">
						AI 에이전트와 결합된 통합 브랜드 생태 시스템입니다.
						<br />
						브랜드의 언어, 시각, 경험을 하나로 연결합니다.
					</p>
				</hgroup>

				{/* CTA row */}
				<div className="mt-10 flex items-center gap-4">
					<Link
						href="/guideline"
						className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-6 font-body text-sm font-normal text-background transition-opacity hover:opacity-75"
					>
						Guideline 보기
					</Link>
					<Link
						href="/create"
						className="inline-flex h-10 items-center justify-center rounded-full border border-border px-6 font-body text-sm font-normal text-foreground transition-opacity hover:opacity-60"
					>
						Studio 열기
					</Link>
				</div>

				{/* Version badge */}
				<div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end gap-3">
					<span className="font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50">
						v1.0
					</span>
					<span className="h-16 w-px bg-foreground/10" />
					<span className="font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 [writing-mode:vertical-rl]">
						Brand Ecosystem
					</span>
				</div>
			</div>

			{/* Marquee strip */}
			<div
				aria-hidden="true"
				className="relative z-10 flex h-10 shrink-0 items-center overflow-hidden border-t border-border"
			>
				<div ref={marqueeRef} className="flex whitespace-nowrap will-change-transform">
					{[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map(
						(item, i) => (
							<span
								key={i}
								className="inline-flex items-center gap-4 px-6 font-body text-xs uppercase tracking-[0.15em] text-muted-foreground/50"
							>
								{item}
								<span className="h-px w-4 bg-foreground/10" />
							</span>
						),
					)}
				</div>
			</div>
		</section>
	)
}
