'use client'

import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useState } from 'react'

export function HeroSection() {
	return (
		<section aria-label="hero" className="relative min-h-0 flex-1">
			{/* Grid lines — decorative */}
			<GridLines col={12} gap={32} />
			<div className="grid h-full grid-rows-auto gap-8 overflow-auto p-4">
				{/* Main content — vertically centered */}
				<section
					aria-labelledby="hero-title"
					className="flex min-h-280 flex-col items-center justify-center border border-border"
				>
					<div className="grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-[0.1em] text-[clamp(3rem,8vw,7rem)]">
						<h1
							id="hero-title"
							className="min-w-0 text-[1em] font-normal leading-none tracking-tight text-foreground"
						>
							Living Brand System
						</h1>
						<div className="flex items-start gap-[0.15em]">
							{/* Decorative dot */}
							<span
								aria-hidden="true"
								className="block size-[0.08em] animate-caret-blink bg-foreground"
							/>
							{/* Version metadata */}
							<VersionCell version="0.1" />
						</div>
					</div>
				</section>
				<section className="grid min-h-256 grid-cols-2 gap-8">
					<LinkBlock href="/guideline" label="Guideline" />
					<LinkBlock href="/create" label="Studio" />
				</section>
				<section className="-mx-4 grid min-h-256 grid-cols-2 gap-8 p-4 bg-neutral-200">
					<div>
						<hgroup className="p-4">
							<h2 className="text-4xl">News</h2>
							<p className="mt-2 text-mut">June 24</p>
						</hgroup>
					</div>
					<LinkBlock href="/guideline" label="Alpha Announcement" />
				</section>
			</div>
		</section>
	)
}

function LinkBlock({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			className="block h-full bg-black p-6 text-white transition-opacity hover:opacity-60"
		>
			<span className="leading-none text-6xl font-light">{label}</span>
		</Link>
	)
}

function GridLines({ col, gap }: { col: number; gap: number }) {
	const length = Math.min(12, Math.max(3, col))

	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 flex opacity-[0.02] dark:opacity-[0.06]"
			style={{ gap: `${gap}px` }}
		>
			{Array.from({ length }, (_, index) => index + 1).map((column) => (
				<div
					key={column}
					className="border-r border-l border-foreground last:border-r-0 flex-1"
				/>
			))}
		</div>
	)
}

function VersionCell({ version }: { version: string }) {
	const VERSION_TAG = 'Alpha Unstable'
	const VERSION_NUMBER = version

	const [hovered, setHovered] = useState(false)

	return (
		<motion.p
			className="
			    inline-flex size-[0.8em] items-start justify-start
			    border border-orange-500 p-[0.1em] text-orange-500
			    transition-colors duration-150
			    hover:bg-orange-500 hover:text-white
			    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500
			  "
			onHoverStart={() => setHovered(true)}
			onHoverEnd={() => setHovered(false)}
			transition={{ type: 'spring', stiffness: 400, damping: 20 }}
		>
			<AnimatePresence initial={false} mode="wait">
				<motion.span
					className="block text-[clamp(0.625rem,0.7rem,0.75rem)] leading-none"
					key={hovered ? 'hover' : 'idle'}
					initial={{ opacity: 0, y: 5 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -5 }}
					transition={{ duration: 0.14 }}
				>
					{hovered ? VERSION_NUMBER : VERSION_TAG}
				</motion.span>
			</AnimatePresence>
		</motion.p>
	)
}
