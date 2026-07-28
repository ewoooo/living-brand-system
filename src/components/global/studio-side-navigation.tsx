'use client'

import { Dashboard, Image, Review, Template } from '@carbon/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { routes } from '@/lib/routes'

const navigation = [
	{ label: 'Studio', href: routes.studio.root, icon: Dashboard },
	{ label: 'Template', href: routes.studio.template, icon: Template },
	{ label: 'Generate', href: routes.studio.generate, icon: Image },
	{ label: 'Review', href: routes.studio.review, icon: Review },
] as const

/** Studio의 작업 진입점만 표시하는 단일 레벨 내비게이션. */
export function StudioSideNavigation() {
	const pathname = usePathname()

	return (
		<aside
			data-slot="studio-side-navigation"
			className="hidden h-full w-(--sidebar-width-icon) shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar p-2 text-sidebar-foreground md:flex xl:w-(--sidebar-width) xl:p-4"
		>
			<nav aria-label="스튜디오 메뉴" className="w-full">
				<SidebarMenu className="gap-1">
					{navigation.map(({ label, href, icon: Icon }) => {
						const active =
							pathname === href ||
							(href !== routes.studio.root && pathname.startsWith(`${href}/`))

						return (
							<SidebarMenuItem key={href}>
								<SidebarMenuButton
									asChild
									isActive={active}
									className="justify-center xl:justify-start"
								>
									<Link
										href={href}
										aria-current={active ? 'page' : undefined}
										title={label}
									>
										<Icon aria-hidden data-icon="inline-start" />
										<span className="sr-only xl:not-sr-only">{label}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)
					})}
				</SidebarMenu>
			</nav>
		</aside>
	)
}
