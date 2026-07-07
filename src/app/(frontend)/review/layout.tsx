import type React from 'react'
import { SectionLayout } from '@/components/section-layout'
import { ImageSelector } from '@/features/review/components/image-selector'
import { ReviewImageProvider } from '@/features/review/components/review-image-provider'
import { ReviewSideNavigation } from '@/features/review/components/review-side-navigation'
import { getReviewRuleset } from '@/features/review/services/get-review-ruleset.service'

// Review reads Payload collections, so CI builds without migrated tables must not prerender it.
export const dynamic = 'force-dynamic'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
	const sections = await getReviewRuleset()

	return (
		<SectionLayout
			nav={
				<ReviewSideNavigation
					sections={sections.map(({ title, slug }) => ({ title, slug }))}
				/>
			}
		>
			<ReviewImageProvider>
				<ReviewWorkspace>{children}</ReviewWorkspace>
			</ReviewImageProvider>
		</SectionLayout>
	)
}

function ReviewWorkspace({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex w-full max-w-[1250px] flex-col">
			<header className="px-8 pt-8">
				<h1 className="text-3xl">Essenherb Brand Design Review</h1>
				<p className="mt-4 max-w-2xl text-muted-foreground leading-7">
					제작한 디자인 산출물을 업로드하면 브랜드 가이드라인 기준에 맞는지 자동으로
					검수합니다. 색·로고·명함 등 항목별로 통과·미통과를 한눈에 확인하고,
					가이드라인에서 벗어난 부분을 빠르게 바로잡을 수 있습니다.
				</p>
			</header>
			<ImageSelector />
			<div className="w-full">{children}</div>
		</div>
	)
}
