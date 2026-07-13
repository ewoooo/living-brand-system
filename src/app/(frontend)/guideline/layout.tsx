import type React from 'react'
import { SectionLayout } from '@/components/global/section-layout'
import { PageNavigation } from '@/components/page-navigation'
import { GuidelineFooter } from '@/features/guideline/components/globals/guideline-footer'
import { GuidelineSideNavigation } from '@/features/guideline/components/globals/guideline-side-navigation'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

export default async function GuidelineLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getGuidelineNavigation()

	return (
		<SectionLayout
			nav={<GuidelineSideNavigation navigation={navigation} />}
			pageNavigation={
				<PageNavigation
					items={[
						{ title: navigation.title, href: '/guideline' },
						...navigation.chapters.flatMap((chapter) => [
							{ title: chapter.title, href: chapter.href },
							...chapter.sections.flatMap((section) => [
								{ title: section.title, href: section.href },
								...section.pages,
							]),
						]),
					]}
				/>
			}
			footer={<GuidelineFooter companyName={navigation.metadata.companyName} />}
		>
			<div className="w-full max-w-[1250px] px-4 py-8 md:px-8 md:py-10">{children}</div>
		</SectionLayout>
	)
}
