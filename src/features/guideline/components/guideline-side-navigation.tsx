'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

type GuidelineSectionProps = GetGuidelineNavigationOutput['sections'][number]

function GuidelineSection({ title, href, pages }: GuidelineSectionProps) {
	const pathname = usePathname()

	return (
		<div className="px-2 py-2">
			{/* 섹션명은 섹션 페이지로 이동 가능 */}
			<Link
				href={href}
				className="block px-2 pb-1 font-medium text-muted-foreground text-xs hover:text-foreground"
			>
				{title}
			</Link>
			{/* 페이지 그룹 왼쪽의 하나의 긴 세로 line */}
			<ul className="ml-2 flex flex-col border-neutral-200 border-l dark:border-neutral-800">
				{pages.map((page) => {
					const active = pathname === page.href
					return (
						<li key={page.id}>
							<Link
								href={page.href}
								aria-current={active ? 'page' : undefined}
								className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors ${
									active
										? 'border-foreground bg-neutral-500/15 font-medium text-foreground'
										: 'border-transparent text-neutral-500 hover:bg-neutral-500/5 hover:text-foreground'
								}`}
							>
								{page.title}
							</Link>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

export function GuidelineSideNavigation({
	navigation,
}: {
	navigation: GetGuidelineNavigationOutput
}) {
	const navigationContent =
		navigation.sections.length > 0 ? (
			navigation.sections.map((section) => <GuidelineSection key={section.id} {...section} />)
		) : (
			<div className="px-4 py-2 text-neutral-400 text-xs">No pages</div>
		)

	return (
		<Sidebar
			collapsible="none"
			className="sticky top-14 h-[calc(100svh-3.5rem)] overflow-y-auto pl-6"
		>
			<SidebarContent className="pt-12">{navigationContent}</SidebarContent>
		</Sidebar>
	)
}
