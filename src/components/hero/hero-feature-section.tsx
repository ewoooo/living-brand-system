import { NavigationBlock } from '@/components/navigation-block'
import { routes } from '@/lib/routes'

export function HeroFeatureSection() {
	return (
		<section
			aria-label="주요 기능"
			data-slot="hero-feature-section"
			className="grid grid-cols-1 gap-4 md:h-full md:min-h-0 md:grid-cols-3 md:grid-rows-3"
		>
			<NavigationBlock
				variant="xl"
				href={routes.guideline}
				label="Guideline"
				className="aspect-square md:aspect-auto"
			/>
			<NavigationBlock
				variant="xl"
				href={routes.studio.root}
				label="Studio"
				className="aspect-square md:aspect-auto"
			/>
			<NavigationBlock
				variant="xl"
				href={routes.studio.template}
				label="Help"
				className="aspect-square md:aspect-auto"
			/>
			<div className="md:row-span-2">
				<NavigationBlock
					variant="xl"
					href={routes.studio.template}
					label="Create"
					className="aspect-square md:aspect-auto"
				/>
			</div>
			<div className="md:col-span-2">
				<NavigationBlock
					variant="xl"
					href={routes.studio.template}
					label="AI"
					className="aspect-square md:aspect-auto"
				/>
			</div>
			<NavigationBlock
				variant="xl"
				href={routes.studio.review}
				label="Review"
				className="aspect-square md:aspect-auto"
			/>
			<NavigationBlock
				variant="xl"
				href={routes.studio.template}
				label="MCP"
				className="aspect-square md:aspect-auto"
			/>
		</section>
	)
}
