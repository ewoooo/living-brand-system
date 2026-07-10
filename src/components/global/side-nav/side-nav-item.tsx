'use client'

import { ChevronDown } from '@carbon/icons-react'
import { usePathname } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'
import { getSideNavLinkClassName, SideNavLink } from '@/components/global/side-nav/side-nav-link'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar'

interface SideNavLinkInput {
	label: string
	href: string
}

export function SideNavItem({ label, href }: SideNavLinkInput) {
	const pathname = usePathname()

	return (
		<SidebarMenuItem>
			<SideNavLink label={label} href={href} active={pathname === href} nested={false} />
		</SidebarMenuItem>
	)
}

export function SideNavSubItem({ label, href }: SideNavLinkInput) {
	const pathname = usePathname()

	return (
		<SidebarMenuSubItem>
			<SideNavLink label={label} href={href} active={pathname === href} nested />
		</SidebarMenuSubItem>
	)
}

export function SideNavBranch({
	label,
	activeHref,
	children,
}: {
	label: string
	activeHref: string
	children: ReactNode
}) {
	const pathname = usePathname()
	const active = pathname === activeHref
	const [open, setOpen] = useState(active)

	useEffect(() => {
		if (active) setOpen(true)
	}, [active])

	return (
		<SidebarMenuItem>
			<Collapsible className="group/collapsible" open={open} onOpenChange={setOpen}>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						className={getSideNavLinkClassName(false)}
						isActive={active}
						size="sm"
					>
						<span>{label}</span>
						<ChevronDown
							className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
							data-icon="inline-end"
						/>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent className="side-nav-collapsible-content">
					<SidebarMenuSub className="mx-0 mb-0 gap-0 border-l-0 py-0 pr-0 pl-3">
						{children}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	)
}
