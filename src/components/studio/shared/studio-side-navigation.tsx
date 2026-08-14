'use client'

import { Connect, Dashboard, Image, Pen, Review, Template } from '@carbon/icons-react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/global/sidebar/sidebar'
import { routes } from '@/lib/routes'

const navigation = [
	{ label: 'Studio', href: routes.studio.root, icon: Dashboard },
	{ label: 'Template', href: routes.studio.template, icon: Template },
	{ label: 'Image', href: routes.studio.generateImage, icon: Image },
	{ label: 'Graphic', href: routes.studio.generateGraphic, icon: Pen },
	{ label: 'Review', href: routes.studio.review, icon: Review },
	{ label: 'MCP', href: routes.studio.mcp, icon: Connect },
] as const

/** Studio의 작업 진입점만 표시하는 단일 레벨 내비게이션. */
export function StudioSideNavigation() {
	const pathname = usePathname()

	return (
		<Sidebar.Root aria-label="스튜디오 메뉴" data-slot="studio-side-navigation">
			<Sidebar.Group>
				{navigation.map(({ label, href, icon }) => (
					<Sidebar.Item
						key={href}
						current={
							pathname === href ||
							(href !== routes.studio.root && pathname.startsWith(`${href}/`))
						}
						href={href}
						icon={icon}
						label={label}
					/>
				))}
			</Sidebar.Group>
		</Sidebar.Root>
	)
}
