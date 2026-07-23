import { NavigationBlock } from '@/components/navigation-block'


export function HeroNewsSection() {
	return (
		<section className="-mx-4 grid min-h-256 md:grid-cols-2 gap-4 p-4 bg-neutral-200">
			<div>
				<hgroup className="p-4">
					<h2 className="text-4xl">News</h2>
					<p className="mt-2 text-mut">June 24</p>
				</hgroup>
			</div>
			<NavigationBlock
				variant="hero"
				href="/guideline"
				label="Alpha Announcement"
				ratio="fill"
			/>
		</section>
	)
}
