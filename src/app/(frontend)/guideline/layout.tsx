import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { PageNavigation } from '@/components/navigation/page-navigation'
import { GuidelineSideNavigation } from '@/features/guideline/components/globals/guideline-side-navigation'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

export default async function GuidelineLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getGuidelineNavigation()

	return (
		<SectionLayout
			nav={<GuidelineSideNavigation navigation={navigation} />}
			pageNavigation={
				<PageNavigation
					items={navigation.chapters.flatMap((chapter) =>
						chapter.sections.map(({ title, href }) => ({ title, href })),
					)}
					unitLabel="섹션"
				/>
			}
		>
			<div className="w-full py-8 md:py-20">{children}</div>
		</SectionLayout>
	)
}
