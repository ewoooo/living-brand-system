import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { GenerateModeNavigation } from '@/components/studio/generate/generate-mode-navigation'
import { StudioSideNavigation } from '@/components/studio/shared/studio-side-navigation'

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
	return (
		<SectionLayout nav={<StudioSideNavigation />} mobileNavigation={false}>
			<div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
				<GenerateModeNavigation />
				<div className="min-h-0">{children}</div>
			</div>
		</SectionLayout>
	)
}
