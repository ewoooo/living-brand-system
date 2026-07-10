import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { SideNav, SideNavGroup, SideNavItem } from '@/components/global/side-nav/side-nav'

export default function ImageLayout({ children }: { children: React.ReactNode }) {
	return (
		<SectionLayout
			nav={
				<SideNav>
					<SideNavGroup title="이미지 생성">
						<SideNavItem label="새 이미지" href="/image" />
					</SideNavGroup>
				</SideNav>
			}
		>
			{children}
		</SectionLayout>
	)
}
