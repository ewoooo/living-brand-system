import {
	SideNav,
	SideNavBranch,
	SideNavGroup,
	SideNavItem,
	SideNavSubItem,
} from '@/components/global/side-nav/side-nav'
import type { GetCreateNavigationOutput } from '@/features/asset-generation/services/get-create-navigation.service'
import { routes } from '@/lib/routes'

/** Templates·Generate·Review가 공유하는 Studio 사이드 내비게이션. */
export function StudioSideNavigation({ navigation }: { navigation: GetCreateNavigationOutput }) {
	return (
		<SideNav>
			<SideNavGroup title="Studio" titleHref={routes.studio.root} />
			<SideNavGroup title="Template" titleHref={routes.studio.template}>
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
			<SideNavGroup title="Generate" titleHref={routes.studio.generate}>
				<SideNavItem label="Image" href={routes.studio.generateImage} />
				<SideNavItem label="Text" href={routes.studio.generateText} />
			</SideNavGroup>
			<SideNavGroup title="Review" titleHref={routes.studio.review} />
		</SideNav>
	)
}
