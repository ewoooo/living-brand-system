import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { SideNav, SideNavGroup, SideNavItem } from '@/components/global/side-nav/side-nav'

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
	return (
		<SectionLayout
			nav={
				<SideNav>
					<SideNavGroup title="생성">
						<SideNavItem label="이미지 생성" href="/generate#image" />
						<SideNavItem label="텍스트 생성" href="/generate#text" />
					</SideNavGroup>
				</SideNav>
			}
		>
			{children}
		</SectionLayout>
	)
}
