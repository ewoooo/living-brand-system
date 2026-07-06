import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

/**
 * 단일 review 페이지의 목차 nav — 라우팅이 아니라 섹션 앵커(#slug)로 스크롤 이동한다.
 */
export function ReviewSideNavigation({
	sections,
}: {
	sections: { title: string; slug: string }[]
}) {
	return (
		<Sidebar collapsible="none" className="h-full overflow-y-auto pl-6">
			<SidebarContent className="pt-12">
				<SidebarGroup>
					{sections.length > 0 ? (
						<SidebarMenu>
							{sections.map((section) => (
								<SidebarMenuItem key={section.slug}>
									<a
										href={`#${section.slug}`}
										className="block rounded-md px-2 py-2 text-muted-foreground text-xs hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
									>
										{section.title}
									</a>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					) : (
						<SidebarGroupLabel className="text-muted-foreground">
							No pages
						</SidebarGroupLabel>
					)}
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	)
}
