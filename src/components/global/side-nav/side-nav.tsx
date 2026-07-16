'use client'

import { AnimatePresence, domAnimation, LazyMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { usePathname } from 'next/navigation'
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
	const pathname = usePathname()

	return (
		<LazyMotion features={domAnimation}>
			<AnimatePresence mode="wait">
				<m.div
					key={pathname}
					className="h-full"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.16, ease: 'easeOut' }}
				>
					<Sidebar
						collapsible="icon"
						className="h-full pl-6 group-data-[collapsible=icon]:pl-0"
					>
						<SidebarContent className="pt-24">
							{Children.count(children) > 0 ? (
								children
							) : (
								<SidebarGroup>
									<SidebarGroupLabel>{emptyText}</SidebarGroupLabel>
								</SidebarGroup>
							)}
						</SidebarContent>
					</Sidebar>
				</m.div>
			</AnimatePresence>
		</LazyMotion>
	)
}
