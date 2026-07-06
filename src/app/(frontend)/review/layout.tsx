import type React from 'react'
import { SectionLayout } from '@/components/section-layout'
import { ReviewSideNavigation } from '@/features/review/components/review-side-navigation'
import { ReviewWorkspace } from '@/features/review/components/review-workspace'
import { ReviewImageProvider } from '@/features/review/image-context'
import { getReviewNavigation } from '@/features/review/navigation'

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
	const navigation = getReviewNavigation()

	return (
		// 사이드 nav도 검수 결과(섹션 상태 표시)를 읽어야 해 provider로 함께 감싼다.
		<ReviewImageProvider>
			<SectionLayout nav={<ReviewSideNavigation chapters={navigation.chapters} />}>
				<ReviewWorkspace>{children}</ReviewWorkspace>
			</SectionLayout>
		</ReviewImageProvider>
	)
}
