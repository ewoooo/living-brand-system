import type React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ReviewSideNavigation } from '@/features/review/components/review-side-navigation'
import { ReviewWorkspace } from '@/features/review/components/review-workspace'
import { ReviewImageProvider } from '@/features/review/image-context'
import { getReviewNavigation } from '@/features/review/navigation'

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
	const navigation = getReviewNavigation()

	return (
		<SidebarProvider className="min-h-full">
			{/* 사이드 nav도 검수 결과(섹션 상태 표시)를 읽어야 해 provider로 함께 감싼다. */}
			<ReviewImageProvider>
				<ReviewSideNavigation chapters={navigation.chapters} />
				<div className="flex min-w-0 flex-1 flex-col items-center">
					<main className="flex min-h-svh w-full flex-1 justify-center px-12">
						<ReviewWorkspace>{children}</ReviewWorkspace>
					</main>
				</div>
			</ReviewImageProvider>
		</SidebarProvider>
	)
}
