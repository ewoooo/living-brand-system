'use client'

import { AnimatePresence, domAnimation, LazyMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { usePathname } from 'next/navigation'
import { Children, type ReactNode } from 'react'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	useSidebar,
} from '@/components/ui/sidebar'

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
	const transitionKey = pathname.split('/')[1] || 'home'
	const { isMobile } = useSidebar()

	return (
		<Sidebar
			collapsible={isMobile ? 'offcanvas' : 'none'}
			className="h-full  p-4 bg-transparent border-r  border-neutral-200 dark:border-neutral-700"
		>
			<LazyMotion features={domAnimation}>
				<AnimatePresence mode="wait">
					<m.div
						key={transitionKey}
						className="flex min-h-0 flex-1 flex-col"
						initial={{ opacity: 0, translateX: -20 }}
						animate={{ opacity: 1, translateX: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: 'easeOut' }}
					>
						<SidebarContent className="gap-1 pt-2">
							{Children.count(children) > 0 ? (
								children
							) : (
								<SidebarGroup>
									<SidebarGroupLabel>{emptyText}</SidebarGroupLabel>
								</SidebarGroup>
							)}
						</SidebarContent>
					</m.div>
				</AnimatePresence>
			</LazyMotion>
		</Sidebar>
	)
}
