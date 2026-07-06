import type React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { GuidelineFooter } from '@/features/guideline/components/guideline-footer'
import { GuidelineSideNavigation } from '@/features/guideline/components/guideline-side-navigation'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

export default async function GuidelineLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getGuidelineNavigation()

	return (
		<SidebarProvider className="h-full min-h-0">
			<GuidelineSideNavigation navigation={navigation} />
			<div className="flex h-full min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto">
				<main className="flex w-full flex-1 justify-center px-4 md:px-12">{children}</main>
				<GuidelineFooter companyName={navigation.metadata.companyName} />
			</div>
		</SidebarProvider>
	)
}
