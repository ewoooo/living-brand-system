import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/global/studio-side-navigation'
import { CheckImageProvider } from '@/features/asset-check/components/check-image-provider'
import { getCheckScenarios } from '@/features/asset-check/services/get-check-scenarios.service'

// Review reads Payload collections, so CI builds without migrated tables must not prerender it.
export const dynamic = 'force-dynamic'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
	const scenarios = await getCheckScenarios()

	return (
		<SectionLayout nav={<StudioSideNavigation />} mobileNavigation={false}>
			<CheckImageProvider scenarios={scenarios}>{children}</CheckImageProvider>
		</SectionLayout>
	)
}
