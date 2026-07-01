import type React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { GuidelineFooter } from '@/features/guideline/components/guideline-footer'
import { GuidelineSideNavigation } from '@/features/guideline/components/guideline-side-navigation'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

export default async function GuidelineLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getGuidelineNavigation()

	return (
		<SidebarProvider className="min-h-full">
			<GuidelineSideNavigation navigation={navigation} />
			<div className="flex min-w-0 flex-1 flex-col items-center">
				<main className="flex min-h-svh w-full flex-1 justify-center px-12">
					{children}
				</main>
				<GuidelineFooter companyName={navigation.metadata.companyName} />
			</div>
		</SidebarProvider>
	)
}
