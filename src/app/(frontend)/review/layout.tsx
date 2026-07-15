import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { PageNavigation } from '@/components/page-navigation'
import { CheckImageProvider } from '@/features/asset-check/components/check-image-provider'
import { CheckSideNavigation } from '@/features/asset-check/components/check-side-navigation'
import { getCheckScenarios } from '@/features/asset-check/services/get-check-scenarios.service'

// Review reads Payload collections, so CI builds without migrated tables must not prerender it.
export const dynamic = 'force-dynamic'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
	const scenarios = await getCheckScenarios()

	return (
		<SectionLayout
			nav={<CheckSideNavigation scenarios={scenarios} />}
			pageNavigation={
				<PageNavigation
					unitLabel="검수"
					items={[
						{ title: '에셋 품질 검수', href: '/review' },
						...scenarios.map((scenario) => ({
							title: scenario.title,
							href: `/review/rules#${scenario.key}`,
						})),
					]}
				/>
			}
		>
			<CheckImageProvider scenarios={scenarios}>{children}</CheckImageProvider>
		</SectionLayout>
	)
}
