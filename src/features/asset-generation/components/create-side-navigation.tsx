import Link from 'next/link'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { GetCreateNavigationOutput } from '../services/get-create-navigation.service'

type CreateCategoryProps = GetCreateNavigationOutput['categories'][number]

function CreateCategory({ title, href, templates }: CreateCategoryProps) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel asChild className="font-medium text-foreground hover:underline">
				<Link href={href}>{title}</Link>
			</SidebarGroupLabel>
			<SidebarMenu>
				{templates.map((template) => (
					<SidebarMenuItem key={template.id}>
						<Link
							href={template.href}
							className="block rounded-md px-2 py-2 text-muted-foreground text-xs hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
						>
							{template.name}
						</Link>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}

export function CreateSideNavigation({ navigation }: { navigation: GetCreateNavigationOutput }) {
	const navigationContent =
		navigation.categories.length > 0 ? (
			navigation.categories.map((category) => (
				<CreateCategory key={category.id} {...category} />
			))
		) : (
			<SidebarGroup>
				<SidebarGroupLabel className="text-muted-foreground">
					발행된 템플릿이 없습니다
				</SidebarGroupLabel>
			</SidebarGroup>
		)

	return (
		<Sidebar collapsible="none" className="h-full overflow-y-auto pl-6">
			<SidebarContent className="pt-12">{navigationContent}</SidebarContent>
		</Sidebar>
	)
}
