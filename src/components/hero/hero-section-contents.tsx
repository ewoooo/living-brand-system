import { NavigationBlock } from '@/components/navigation-block'

export function HeroContentSection() {
	return (
		<section aria-label="주요 메뉴" className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<NavigationBlock variant="hero" href="/guideline" label="Guideline" />
			<NavigationBlock variant="hero" href="/create" label="Studio" />
			<NavigationBlock variant="hero" href="/create" label="Help" />
			<div className="md:row-span-2">
				<NavigationBlock variant="hero" href="/create" label="Create" ratio="portrait" />
			</div>
			<div className="md:col-span-2">
				<NavigationBlock variant="hero" href="/create" label="AI" ratio="landscape" />
			</div>
			<NavigationBlock variant="hero" href="/review" label="Review" />
			<NavigationBlock variant="hero" href="/create" label="MCP" />
		</section>
	)
}
