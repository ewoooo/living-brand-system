'use client'

import { HeroContentSection } from '@/components/hero/hero-section-contents'
import { HeroMainSection } from '@/components/hero/hero-section-main'
import { HeroNewsSection } from '@/components/hero/hero-section-news'

export function HeroSection() {
	return (
		<section aria-label="hero" className="relative">
			{/* Grid lines — decorative */}
			<GridLines col={12} gap={16} padding={16} />

			{/* Main content — vertically centered */}
			<div className="grid grid-cols-[minmax(0,1fr)] grid-rows-auto gap-4 p-4">
				<HeroMainSection />
				<HeroContentSection />
				<HeroNewsSection />
			</div>
		</section>
	)
}

function GridLines({ col, gap, padding = 0 }: { col: number; gap: number; padding?: number }) {
	// Constrains the number of columns to be between 3 and 12
	const length = Math.min(12, Math.max(3, col))

	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 flex opacity-[0.02] dark:opacity-[0.06]"
			style={{ gap: `${gap}px`, padding: `${padding ?? 0}px` }}
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
