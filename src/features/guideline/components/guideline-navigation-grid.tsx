import { ArrowRight } from '@carbon/icons-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export function GuidelineNavigationGrid({
	items,
	headingAs: Heading = 'h3',
}: {
	items: readonly { id: number; title: string; href: string; icon?: ReactNode }[]
	headingAs?: 'h2' | 'h3'
}) {
	return (
		<section className="grid grid-cols-2 border-border border-t border-l">
			{items.map((item) => (
				<Link
					key={item.id}
					href={item.href}
					className="flex aspect-[2/1] flex-col justify-between border-border border-r border-b bg-background p-6 transition-colors hover:bg-accent"
				>
					<Heading className="font-body font-normal text-2xl">{item.title}</Heading>
					{/* 하단 행: 좌=연결 아이콘(선택, 있을 때만 렌더), 우=이동 링크 어포던스 */}
					<div className="flex items-center">
						{item.icon}
						<ArrowRight className="ml-auto" size={24} />
					</div>
				</Link>
			))}
		</section>
	)
}
