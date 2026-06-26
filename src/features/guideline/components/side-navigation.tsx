import Link from 'next/link'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { GetGuidelineNavigationOutput } from '@/services/get-guideline-navigation.service'

type GuidelineSectionProps = GetGuidelineNavigationOutput['sections'][number]

function GuidelineSection({ title, pages }: GuidelineSectionProps) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel className="text-neutral-400">{title}</SidebarGroupLabel>
			<SidebarMenu>
				{pages.map((page) => (
					<SidebarMenuItem key={page.id}>
						<SidebarMenuButton asChild>
							<Link href={page.href}>{page.title}</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}

export function GuidelineNavigation({ navigation }: { navigation: GetGuidelineNavigationOutput }) {
	const navigationContent =
		navigation.sections.length > 0 ? (
			navigation.sections.map((section) => <GuidelineSection key={section.id} {...section} />)
		) : (
			<SidebarGroup>
				<SidebarGroupLabel className="text-neutral-400">No pages</SidebarGroupLabel>
			</SidebarGroup>
		)

	return (
		<Sidebar collapsible="none" className="pl-6">
			<SidebarContent className="pt-12">{navigationContent}</SidebarContent>
		</Sidebar>
	)
}
