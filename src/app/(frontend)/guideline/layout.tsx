import type React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { GuidelineChat } from '@/features/guideline/components/side-chat'
import { GuidelineNavigation } from '@/features/guideline/components/side-navigation'

export default function GuidelineLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider className="min-h-0">
			<GuidelineNavigation />
			<main className="flex-1">{children}</main>
			<GuidelineChat />
		</SidebarProvider>
	)
}
