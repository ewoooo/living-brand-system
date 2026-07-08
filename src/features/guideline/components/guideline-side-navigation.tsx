import { SideNav, type SideNavGroup } from '@/components/side-nav'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

export function GuidelineSideNavigation({
	navigation,
}: {
	navigation: GetGuidelineNavigationOutput
}) {
	const groups: SideNavGroup[] = navigation.sections.map((section) => ({
		key: section.id,
		title: section.title,
		titleHref: section.href,
		items: section.pages.map((page) => ({
			key: page.id,
			label: page.title,
			href: page.href,
		})),
	}))

	return (
		<SideNav
			groups={groups}
			empty={<div className="px-4 py-2 text-neutral-400 text-xs">페이지 없음</div>}
		/>
	)
}
