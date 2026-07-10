import { SideNav, SideNavGroup, SideNavItem } from '@/components/global/side-nav/side-nav'
import type { GetCreateNavigationOutput } from '../services/get-create-navigation.service'

export function CreateSideNavigation({ navigation }: { navigation: GetCreateNavigationOutput }) {
	return (
		<SideNav emptyText="발행된 템플릿이 없습니다">
			{navigation.categories.map((category) => (
				<SideNavGroup key={category.id} title={category.title} titleHref={category.href}>
					{category.templates.map((template) => (
						<SideNavItem key={template.id} label={template.name} href={template.href} />
					))}
				</SideNavGroup>
			))}
		</SideNav>
	)
}
