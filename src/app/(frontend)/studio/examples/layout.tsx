import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { StudioSideNavigation } from '@/components/global/studio-side-navigation'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'
import { getImageProfileNavigation } from '@/features/image-generation/services/list-image-profiles.service'
import { authenticateRequest } from '@/lib/request-auth'

export const dynamic = 'force-dynamic'

export default async function ExamplesLayout({ children }: { children: React.ReactNode }) {
	const { user } = await authenticateRequest()
	const [navigation, imageProfiles] = await Promise.all([
		getCreateNavigation(),
		getImageProfileNavigation(user),
	])

	return (
		<SectionLayout
			nav={<StudioSideNavigation navigation={navigation} imageProfiles={imageProfiles} />}
		>
			{children}
		</SectionLayout>
	)
}
