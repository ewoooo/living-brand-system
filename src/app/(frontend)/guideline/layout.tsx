import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { GuidelineFooter } from '@/features/guideline/components/guideline-footer'
import { GuidelineSideNavigation } from '@/features/guideline/components/guideline-side-navigation'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

export default async function GuidelineLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getGuidelineNavigation()

	return (
		<SectionLayout
			nav={<GuidelineSideNavigation navigation={navigation} />}
			footer={<GuidelineFooter companyName={navigation.metadata.companyName} />}
		>
			<div className="w-full max-w-[1250px] px-4 py-8 md:px-8 md:py-10">{children}</div>
		</SectionLayout>
	)
}
