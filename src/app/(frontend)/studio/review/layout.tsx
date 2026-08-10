import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/studio/shared/studio-side-navigation'
import { CheckImageProvider } from '@/features/asset-check/hooks/use-check-images'
import { listPublishedCheckScenarios } from '@/features/quality-rule/services/list-published-check-scenarios.service'

// Review reads Payload collections, so CI builds without migrated tables must not prerender it.
export const dynamic = 'force-dynamic'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
	const scenarios = await listPublishedCheckScenarios()

	return (
		<SectionLayout nav={<StudioSideNavigation />} mobileNavigation={false}>
			<CheckImageProvider scenarios={scenarios}>{children}</CheckImageProvider>
		</SectionLayout>
	)
}
