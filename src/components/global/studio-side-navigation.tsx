import {
	SideNav,
	SideNavBranch,
	SideNavGroup,
	SideNavItem,
	SideNavSubItem,
} from '@/components/global/side-nav/side-nav'
import type { GetCreateNavigationOutput } from '@/features/asset-generation/services/get-create-navigation.service'

/** Templates·Generate·Review가 공유하는 Studio 사이드 내비게이션. */
export function StudioSideNavigation({ navigation }: { navigation: GetCreateNavigationOutput }) {
	return (
		<SideNav>
			<SideNavGroup title="Template" titleHref="/create">
				{navigation.categories.map((category) =>
					category.templates.length > 0 ? (
						<SideNavBranch
							key={category.id}
							label={category.title}
							activeHref={category.href}
						>
							{category.templates.map((template) => (
								<SideNavSubItem
									key={template.id}
									label={template.name}
									href={template.href}
								/>
							))}
						</SideNavBranch>
					) : (
						<SideNavItem
							key={category.id}
							label={category.title}
							href={category.href}
						/>
					),
				)}
			</SideNavGroup>
			<SideNavGroup title="Generate" titleHref="/generate">
				<SideNavItem label="Image" href="/generate#image" />
				<SideNavItem label="Text" href="/generate#text" />
			</SideNavGroup>
			<SideNavGroup title="Review" titleHref="/review" />
		</SideNav>
	)
}
