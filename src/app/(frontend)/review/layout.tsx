import type React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ReviewSideNavigation } from '@/features/review/components/review-side-navigation'
import { getReviewNavigation } from '@/features/review/navigation'

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
	const navigation = getReviewNavigation()

	return (
		<SidebarProvider className="min-h-full">
			<ReviewSideNavigation chapters={navigation.chapters} />
			<div className="flex min-w-0 flex-1 flex-col items-center">
				<main className="flex min-h-svh w-full max-w-[1600px] flex-1 justify-center">
					{children}
				</main>
			</div>
		</SidebarProvider>
	)
}
