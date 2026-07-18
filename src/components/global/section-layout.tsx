import { SidePanelOpen } from '@carbon/icons-react'
import type React from 'react'
import { GlobalFooter } from '@/components/global/footer/global-footer'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

/**
 * 섹션(가이드라인·검수·제작) 공통 레이아웃 셸 — 사이드 nav + 스크롤 main.
 * 이 셸은 nav·스크롤·랜드마크·footer만 소유하고, 본문 폭과 여백은 ContentFrame이 맡는다.
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
					aria-label="목차 접기 또는 펼치기"
					className="mx-4 mt-4 self-start md:hidden"
					size="icon"
				>
					<SidePanelOpen data-icon="inline-start" />
				</SidebarTrigger>
				<main className="w-full flex-1">{children}</main>
				{pageNavigation}
				<GlobalFooter />
			</div>
		</SidebarProvider>
	)
}
