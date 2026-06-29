import type React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AgentChat } from '@/features/agent/components/agent-chat'
import { GuidelineNavigation } from '@/features/guideline/components/side-navigation'
import { getGuidelineNavigation } from '@/services/get-guideline-navigation.service'

export default async function GuidelineLayout({ children }: { children: React.ReactNode }) {
	const navigation = await getGuidelineNavigation()

	return (
		<SidebarProvider className="min-h-full">
			<GuidelineNavigation navigation={navigation} />
			<main className="flex-1 flex justify-center">{children}</main>
			<AgentChat />
		</SidebarProvider>
	)
}
