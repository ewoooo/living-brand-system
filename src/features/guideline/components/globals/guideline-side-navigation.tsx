import {
	SideNav,
	SideNavBranch,
	SideNavGroup,
	SideNavItem,
	SideNavSubItem,
} from '@/components/global/side-nav/side-nav'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

type GuidelineSection = GetGuidelineNavigationOutput['chapters'][number]['sections'][number]

export function GuidelineSideNavigation({
	navigation,
}: {
	navigation: GetGuidelineNavigationOutput
}) {
	return (
		<SideNav>
			{navigation.chapters.map((chapter) => (
				<SideNavGroup key={chapter.id} title={chapter.title} titleHref={chapter.href}>
					{chapter.sections.map((section) => {
						const pages = getGuidelineSectionPages(section)
						if (pages.length === 0) {
							return (
								<SideNavItem
									key={section.id}
									label={section.title}
									href={section.href}
								/>
							)
						}
						return (
							<SideNavBranch
								key={section.id}
								label={section.title}
								activeHref={section.href}
							>
								{pages.map((page) => (
									<SideNavSubItem
										key={page.id}
										label={page.title}
										href={page.href}
									/>
								))}
							</SideNavBranch>
						)
					})}
				</SideNavGroup>
			))}
		</SideNav>
	)
}

export function getGuidelineSectionPages(section: GuidelineSection) {
	return section.pages.length === 1 && section.pages[0]?.title.trim() === section.title.trim()
		? []
		: section.pages
}
