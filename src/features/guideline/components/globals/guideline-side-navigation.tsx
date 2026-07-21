import { SideNav, SideNavGroup, SideNavItem } from '@/components/global/side-nav/side-nav'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'

/**
 * 좌측 사이트 사이드바 — chapter(그룹) > section(링크)의 route 계층만 소유한다.
 * 섹션 하위 Page는 route가 아니라 섹션 페이지의 in-page 앵커이므로, 사이드바가 아니라
 * 각 섹션 페이지의 "On this page" 목차(GuidelineOnThisPage)가 담당한다.
 */
export function GuidelineSideNavigation({
	navigation,
}: {
	navigation: GetGuidelineNavigationOutput
}) {
	return (
		<SideNav>
			{navigation.chapters.map((chapter) => (
				<SideNavGroup key={chapter.id} title={chapter.title} titleHref={chapter.href}>
					{chapter.sections.map((section) => (
						<SideNavItem key={section.id} label={section.title} href={section.href} />
					))}
				</SideNavGroup>
			))}
		</SideNav>
	)
}
