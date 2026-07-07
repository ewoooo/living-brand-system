import type React from 'react'
import { SectionLayout } from '@/components/section-layout'
import { CheckImageProvider } from '@/features/asset-check/components/check-image-provider'
import { CheckSideNavigation } from '@/features/asset-check/components/check-side-navigation'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'

// Review reads Payload collections, so CI builds without migrated tables must not prerender it.
export const dynamic = 'force-dynamic'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
	const sections = await getCheckRuleset()

	return (
		<SectionLayout nav={<CheckSideNavigation sections={sections} />}>
			<CheckImageProvider>{children}</CheckImageProvider>
		</SectionLayout>
	)
}
