import { ArrowRight } from '@carbon/icons-react'
import type { ReactNode } from 'react'
import { NavigationBlock } from '@/components/navigation/navigation-block'

export function GuidelineNavigationGrid({
	items,
	variant,
}: {
	items: readonly {
		id: number
		title: string
		description?: string | null
		href: string
		icon?: ReactNode
	}[]
	variant: 'prominent' | 'default'
}) {
	return (
		<section className="grid grid-cols-1 border-border border-t border-l md:grid-cols-2">
			{items.map((item) => (
				<NavigationBlock
					key={item.id}
					variant={variant}
					href={item.href}
					label={item.title}
					description={item.description}
					tail={
						<>
							{item.icon}
							<ArrowRight aria-hidden className="ml-auto" size={24} />
						</>
					}
					className="md:aspect-[2/1]"
				/>
			))}
		</section>
	)
}
