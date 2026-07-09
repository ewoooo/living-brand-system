import { SideNav, type SideNavGroup } from '@/components/global/side-nav'
import type { GetCreateNavigationOutput } from '../services/get-create-navigation.service'

export function CreateSideNavigation({ navigation }: { navigation: GetCreateNavigationOutput }) {
	return (
		<SideNav groups={toCreateSideNavGroups(navigation)} emptyText="발행된 템플릿이 없습니다" />
	)
}

export function toCreateSideNavGroups(navigation: GetCreateNavigationOutput): SideNavGroup[] {
	return navigation.categories.map((category) => ({
		key: category.id,
		title: category.title,
		titleHref: category.href,
		items: category.templates.map((template) => ({
			key: template.id,
			label: template.name,
			href: template.href,
		})),
	}))
}
