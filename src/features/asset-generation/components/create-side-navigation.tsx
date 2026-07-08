import { SideNav, type SideNavGroup } from '@/components/side-nav'
import type { GetCreateNavigationOutput } from '../services/get-create-navigation.service'

export function CreateSideNavigation({ navigation }: { navigation: GetCreateNavigationOutput }) {
	const groups: SideNavGroup[] = navigation.categories.map((category) => ({
		key: category.id,
		title: category.title,
		titleHref: category.href,
		items: category.templates.map((template) => ({
			key: template.id,
			label: template.name,
			href: template.href,
		})),
	}))

	return <SideNav groups={groups} emptyText="발행된 템플릿이 없습니다" />
}
