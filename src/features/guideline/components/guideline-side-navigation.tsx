import { SideNav, type SideNavGroup } from '@/components/global/side-nav'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

export function GuidelineSideNavigation({
	navigation,
}: {
	navigation: GetGuidelineNavigationOutput
}) {
	return <SideNav groups={toGuidelineSideNavGroups(navigation)} />
}

export function toGuidelineSideNavGroups(navigation: GetGuidelineNavigationOutput): SideNavGroup[] {
	return navigation.chapters.map((chapter) => ({
		key: chapter.id,
		title: chapter.title,
		titleHref: chapter.href,
		items: chapter.sections.map((section) => ({
			key: section.id,
			label: section.title,
			href: section.href,
			children:
				section.pages.length === 1 &&
				section.pages[0]?.title.trim() === section.title.trim()
					? []
					: section.pages.map((page) => ({
							key: page.id,
							label: page.title,
							href: page.href,
						})),
		})),
	}))
}
