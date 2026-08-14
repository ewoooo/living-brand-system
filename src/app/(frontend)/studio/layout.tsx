import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/studio/shared/studio-side-navigation'

export default function StudioLayout({ children }: { children: React.ReactNode }) {
	return (
		<SectionLayout
			nav={<StudioSideNavigation />}
			mobileNavigation={false}
			sidebarStorageKey="lbs.studioSidebarOpen"
		>
			{children}
		</SectionLayout>
	)
}
