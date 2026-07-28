import { HeroFeatureSection } from '@/components/hero/hero-feature-section'
import { HeroFooter } from '@/components/hero/hero-footer'
import { HeroMainSection } from '@/components/hero/hero-main-section'

export function HeroSection() {
	return (
		<>
			<section aria-label="hero" className="relative h-full p-4">
				<GridLines col={12} gap={16} padding={16} />
				<HeroMainSection />
			</section>
			<div className="relative min-h-full p-4 md:h-full">
				<GridLines col={12} gap={16} padding={16} />
				<HeroFeatureSection />
			</div>
			<HeroFooter />
		</>
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
