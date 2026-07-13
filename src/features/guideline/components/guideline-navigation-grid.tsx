import { ArrowRight } from '@carbon/icons-react'
import Link from 'next/link'

export function GuidelineNavigationGrid({
	items,
	headingAs: Heading = 'h3',
}: {
	items: readonly { id: number; title: string; href: string }[]
	headingAs?: 'h2' | 'h3'
}) {
	return (
		<section className="grid grid-cols-2 gap-px border border-border bg-border">
			{items.map((item) => (
				<Link
					key={item.id}
					href={item.href}
					className="flex aspect-square flex-col bg-background p-4 transition-colors hover:bg-muted"
				>
					<Heading className="text-2xl">{item.title}</Heading>
					<div className="mt-auto p-2">
						<ArrowRight size={24} />
					</div>
				</Link>
			))}
		</section>
	)
}
