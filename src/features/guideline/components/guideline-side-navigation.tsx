'use client'

import Link from 'next/link'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

type GuidelineSectionProps = GetGuidelineNavigationOutput['sections'][number]

function GuidelineSection({ title, href, pages }: GuidelineSectionProps) {
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
				{pages.map((page) => (
					<li key={page.id}>
						<Link
							href={page.href}
							className="-ml-px block border-transparent border-l-2 py-1.5 pl-4 text-neutral-500 text-sm transition-colors hover:bg-neutral-500/5 hover:text-foreground"
						>
							{page.title}
						</Link>
					</li>
				))}
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
			navigation.sections.map((section) => (
				<div key={section.id}>
					<GuidelineSection {...section} />
				</div>
			))
		) : (
			<div className="px-4 py-2 text-neutral-400 text-xs">No pages</div>
		)

	return (
		<Sidebar collapsible="none" className="h-full overflow-y-auto pl-6">
			<SidebarContent className="pt-12">{navigationContent}</SidebarContent>
		</Sidebar>
	)
}
