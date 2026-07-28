import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/global/studio-side-navigation'
import { CheckImageProvider } from '@/features/asset-check/components/check-image-provider'
import { getCheckScenarios } from '@/features/asset-check/services/get-check-scenarios.service'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'
import { getImageProfileNavigation } from '@/features/image-generation/services/list-image-profiles.service'
import { authenticateRequest } from '@/lib/request-auth'

// Review reads Payload collections, so CI builds without migrated tables must not prerender it.
export const dynamic = 'force-dynamic'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
	const { user } = await authenticateRequest()
	const [navigation, scenarios, imageProfiles] = await Promise.all([
		getCreateNavigation(),
		getCheckScenarios(),
		getImageProfileNavigation(user),
	])

	return (
		<SectionLayout
			nav={<StudioSideNavigation navigation={navigation} imageProfiles={imageProfiles} />}
		>
			<CheckImageProvider scenarios={scenarios}>{children}</CheckImageProvider>
		</SectionLayout>
	)
}
