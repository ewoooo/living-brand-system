import { SideNav, type SideNavGroup } from '@/components/side-nav'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

export function GuidelineSideNavigation({
	navigation,
}: {
	navigation: GetGuidelineNavigationOutput
}) {
	const groups: SideNavGroup[] = navigation.chapters.map((chapter) => ({
		key: chapter.id,
		title: chapter.title,
		titleHref: chapter.href,
		items: chapter.sections.map((section) => ({
			key: section.id,
			label: section.title,
			href: section.href,
			children: section.pages.map((page) => ({
				key: page.id,
				label: page.title,
				href: page.href,
			})),
		})),
	}))

	return <SideNav groups={groups} />
}
