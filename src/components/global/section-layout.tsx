import type React from 'react'
import { GlobalFooter } from '@/components/global/footer/global-footer'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

/**
 * 섹션(가이드라인·검수·제작) 공통 레이아웃 셸 — 사이드 nav + 가운데 정렬 스크롤 main.
 * nav를 쓰는 섹션은 이 하나를 재사용한다. 레이아웃을 섹션마다 손으로 복붙해 미묘하게
 * 달라지는 것을 막고, main 영역(패딩·스크롤·정렬)을 사이트 기본으로 통일한다.
 */
export function SectionLayout({
	nav,
	children,
	pageNavigation,
}: {
	nav: React.ReactNode
	children: React.ReactNode
	pageNavigation?: React.ReactNode
}) {
	return (
		<SidebarProvider className="h-full min-h-0">
			{nav}
			<div className="flex h-full min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto motion-safe:scroll-smooth">
				<SidebarTrigger
					aria-label="목차 열기"
					className="mx-4 mt-4 self-start md:hidden"
					size="default"
				>
					목차
				</SidebarTrigger>
				<main className="flex w-full flex-1 justify-center px-4 md:px-12">{children}</main>
				{pageNavigation}
				<GlobalFooter />
			</div>
		</SidebarProvider>
	)
}
