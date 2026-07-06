import type React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ReviewSideNavigation } from '@/features/review/components/review-side-navigation'
import { ReviewWorkspace } from '@/features/review/components/review-workspace'
import { ReviewImageProvider } from '@/features/review/image-context'
import { getReviewRuleset } from '@/features/review/services/get-review-ruleset.service'

// Review reads Payload collections, so CI builds without migrated tables must not prerender it.
export const dynamic = 'force-dynamic'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
	const sections = await getReviewRuleset()

	return (
		<SidebarProvider className="h-full min-h-0">
			{/* 사이드 nav도 검수 결과(섹션 상태 표시)를 읽어야 해 provider로 함께 감싼다. */}
			<ReviewImageProvider>
				<ReviewSideNavigation
					sections={sections.map(({ title, slug }) => ({ title, slug }))}
				/>
				<div className="flex h-full min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto">
					<main className="flex w-full flex-1 justify-center px-12">
						<ReviewWorkspace>{children}</ReviewWorkspace>
					</main>
				</div>
			</ReviewImageProvider>
		</SidebarProvider>
	)
}
