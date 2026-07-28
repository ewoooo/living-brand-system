import { NavigationBlock } from '@/components/navigation-block'
import { routes } from '@/lib/routes'

export function HeroFeatureSection() {
	return (
		<section
			aria-label="주요 기능"
			data-slot="hero-feature-section"
			className="grid grid-cols-1 gap-4 md:grid-cols-3"
		>
			<NavigationBlock variant="hero" href={routes.guideline} label="Guideline" />
			<NavigationBlock variant="hero" href={routes.studio.root} label="Studio" />
			<NavigationBlock variant="hero" href={routes.studio.template} label="Help" />
			<div className="md:row-span-2">
				<NavigationBlock
					variant="hero"
					href={routes.studio.template}
					label="Create"
					ratio="portrait"
				/>
			</div>
			<div className="md:col-span-2">
				<NavigationBlock
					variant="hero"
					href={routes.studio.template}
					label="AI"
					ratio="landscape"
				/>
			</div>
			<NavigationBlock variant="hero" href={routes.studio.review} label="Review" />
			<NavigationBlock variant="hero" href={routes.studio.template} label="MCP" />
		</section>
	)
}
