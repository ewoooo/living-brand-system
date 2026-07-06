import type React from 'react'
import { SectionLayout } from '@/components/section-layout'
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
			{children}
		</SectionLayout>
	)
}
