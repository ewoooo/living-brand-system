import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { PageNavigation } from '@/components/page-navigation'
import { CheckImageProvider } from '@/features/asset-check/components/check-image-provider'
import { CheckSideNavigation } from '@/features/asset-check/components/check-side-navigation'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'
import { toCheckAnchor } from '@/features/asset-check/utils/check-anchor'

// Review reads Payload collections, so CI builds without migrated tables must not prerender it.
export const dynamic = 'force-dynamic'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
	const sections = await getCheckRuleset()

	return (
		<SectionLayout
			nav={<CheckSideNavigation sections={sections} />}
			pageNavigation={
				<PageNavigation
					items={[
						{ title: '에셋 품질 검수', href: '/review' },
						{ title: '검수 Check', href: '/review/rules' },
						...sections.flatMap((section) => [
							{ title: section.title, href: `/review/rules#${section.slug}` },
							...section.checks.map((check) => ({
								title: check.title,
								href: `/review/rules#${toCheckAnchor(section.slug, check.key)}`,
							})),
						]),
					]}
				/>
			}
		>
			<CheckImageProvider>{children}</CheckImageProvider>
		</SectionLayout>
	)
}
