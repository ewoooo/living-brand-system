'use client'

import Link from 'next/link'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

type GuidelineSectionProps = GetGuidelineNavigationOutput['sections'][number]

function GuidelineSection({ title, href, pages }: GuidelineSectionProps) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel asChild className="font-medium text-foreground hover:underline">
				<Link href={href}>{title}</Link>
			</SidebarGroupLabel>
			<SidebarMenu>
				{pages.map((page) => (
					<SidebarMenuItem key={page.id}>
						<Link
							href={page.href}
							className="block rounded-md px-2 py-2 text-muted-foreground text-xs hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
						>
							{page.title}
						</Link>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
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
			<SidebarGroup>
				<SidebarGroupLabel className="text-muted-foreground">No pages</SidebarGroupLabel>
			</SidebarGroup>
		)

	return (
		<Sidebar collapsible="none" className="h-full overflow-y-auto pl-6">
			<SidebarContent className="pt-12">{navigationContent}</SidebarContent>
		</Sidebar>
	)
}
