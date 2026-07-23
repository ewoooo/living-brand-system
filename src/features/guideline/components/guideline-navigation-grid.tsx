import type { ReactNode } from 'react'
import { NavigationBlock } from '@/components/navigation-block'

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
	variant: 'onboard' | 'section'
}) {
	return (
		<section className="grid grid-cols-2 border-border border-t border-l">
			{items.map((item) => (
				<NavigationBlock
					key={item.id}
					variant={variant}
					href={item.href}
					label={item.title}
					description={item.description}
					icon={item.icon}
				/>
			))}
		</section>
	)
}
