import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/global/studio-side-navigation'

export default function ExamplesLayout({ children }: { children: React.ReactNode }) {
	return (
		<SectionLayout nav={<StudioSideNavigation />} mobileNavigation={false}>
			{children}
		</SectionLayout>
	)
}
