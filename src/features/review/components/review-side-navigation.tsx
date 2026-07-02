import Link from 'next/link'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { ReviewNavChapter } from '@/features/review/navigation'

function ReviewChapter({ code, name, sections }: ReviewNavChapter) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel className="font-medium text-foreground">
				{code}. {name}
			</SidebarGroupLabel>
			<SidebarMenu>
				{sections.map((section) => (
					<SidebarMenuItem key={section.slug}>
						<Link
							href={section.href}
							className="block rounded-md px-2 py-2 text-neutral-500 text-xs hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
						>
							{section.name}
						</Link>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}

export function ReviewSideNavigation({ chapters }: { chapters: ReviewNavChapter[] }) {
	return (
		<Sidebar
			collapsible="none"
			className="sticky top-14 h-[calc(100svh-3.5rem)] overflow-y-auto pl-6"
		>
			<SidebarContent className="pt-12">
				{chapters.map((chapter) => (
					<ReviewChapter key={chapter.code} {...chapter} />
				))}
			</SidebarContent>
		</Sidebar>
	)
}
