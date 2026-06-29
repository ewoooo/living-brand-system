import type React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { GuidelineAgentChat } from '@/features/guideline/components/guideline-agent-chat'
import { GuidelineFooter } from '@/features/guideline/components/guideline-footer'
import { GuidelineSideNavigation } from '@/features/guideline/components/guideline-side-navigation'
import { getGuidelineNavigation } from '@/services/get-guideline-navigation.service'

export default async function GuidelineLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getGuidelineNavigation()

	return (
		<SidebarProvider className="min-h-full">
			<GuidelineSideNavigation navigation={navigation} />
			<div className="flex min-w-0 flex-1 flex-col">
				<main className="flex flex-1 justify-center min-h-svh">{children}</main>
				<GuidelineFooter />
			</div>
			<GuidelineAgentChat />
		</SidebarProvider>
	)
}
