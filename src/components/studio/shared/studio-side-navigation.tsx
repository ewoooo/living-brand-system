'use client'

import { Connect, Home, Image, Pen, Review, Template } from '@carbon/icons-react'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'
import { Sidebar } from '@/components/global/sidebar/sidebar'
import { useSidebar } from '@/components/ui/sidebar'
import { routes } from '@/lib/routes'

const navigationGroups = [
	[{ label: 'Get Started', href: routes.studio.root, icon: Home }],
	[
		{ label: 'Template', href: routes.studio.template, icon: Template },
		{ label: 'Image', href: routes.studio.generateImage, icon: Image },
		{ label: 'Graphic', href: routes.studio.generateGraphic, icon: Pen },
	],
	[
		{ label: 'Review', href: routes.studio.review, icon: Review },
		{ label: 'MCP', href: routes.studio.mcp, icon: Connect },
	],
] as const

/** Studio의 작업 진입점만 표시하는 단일 레벨 내비게이션. */
export function StudioSideNavigation() {
	const pathname = usePathname()
	const { state } = useSidebar()

	return (
		<Sidebar.Root
			data-slot="studio-side-navigation"
			aria-label="스튜디오 메뉴"
			collapsed={state === 'collapsed'}
		>
			{navigationGroups.map((group, index) => (
				<Fragment key={group[0].href}>
					{index > 0 && <Sidebar.Separator />}
					<Sidebar.Group>
						{group.map(({ label, href, icon }) => {
							const current =
								pathname === href ||
								(href !== routes.studio.root && pathname.startsWith(`${href}/`))

							return (
								<Sidebar.Item
									key={href}
									current={current}
									href={href}
									icon={icon}
									label={label}
								/>
							)
						})}
					</Sidebar.Group>
				</Fragment>
			))}
			<Sidebar.Trigger />
		</Sidebar.Root>
	)
}
