'use client'

import { Children, type ReactNode } from 'react'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar'

export { SideNavGroup } from '@/components/global/side-nav/side-nav-group'
export {
	SideNavBranch,
	SideNavItem,
	SideNavSubItem,
} from '@/components/global/side-nav/side-nav-item'

/**
 * 사이트 공통 side nav 셸 — 모바일·접기·빈 상태만 소유하고, 내용 위계는 각 도메인이 조합한다.
 */
export function SideNav({
	children,
	emptyText = '페이지 없음',
}: {
	children: ReactNode
	emptyText?: string
}) {
	return (
		<Sidebar collapsible="offcanvas" className="h-full pl-6">
			<SidebarContent className="pt-12">
				{Children.count(children) > 0 ? (
					children
				) : (
					<SidebarGroup>
						<SidebarGroupLabel>{emptyText}</SidebarGroupLabel>
					</SidebarGroup>
				)}
			</SidebarContent>
		</Sidebar>
	)
}
