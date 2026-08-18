import { SidePanelOpen } from '@carbon/icons-react'
import type React from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type SectionLayoutProps = {
	nav: React.ReactNode
	children: React.ReactNode
	pageNavigation?: React.ReactNode
	mobileNavigation?: boolean
	sidebarStorageKey?: string
	variant?: 'document' | 'workspace'
}

/**
 * 섹션(가이드라인·검수·제작) 공통 레이아웃 셸 — 사이드 nav + 스크롤 main.
 * 이 셸은 nav·스크롤·랜드마크만 소유하고, 본문 폭과 여백은 ContentFrame이 맡는다.
 */
export function SectionLayout({
	nav,
	children,
	pageNavigation,
	mobileNavigation = true,
	sidebarStorageKey,
	variant = 'document',
}: SectionLayoutProps) {
	return (
		<SidebarProvider
			className="h-full min-h-0 pt-[50px] xl:pt-(--global-header-height)"
			storageKey={sidebarStorageKey}
		>
			{nav}
			<SectionBody
				mobileNavigation={mobileNavigation}
				pageNavigation={pageNavigation}
				variant={variant}
			>
				{children}
			</SectionBody>
		</SidebarProvider>
	)
}

/** nav 옆의 남은 화면을 차지하며 본문·페이지 이동의 세로 크기를 결정한다. */
function SectionBody({
	children,
	mobileNavigation,
	pageNavigation,
	variant,
}: {
	children: React.ReactNode
	mobileNavigation: boolean
	pageNavigation?: React.ReactNode
	variant: 'document' | 'workspace'
}) {
	return (
		<div
			data-slot="section-scroll-container"
			className={cn(
				'flex h-full min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto motion-safe:scroll-smooth',
				variant === 'workspace' && 'lg:overflow-hidden',
			)}
		>
			{mobileNavigation && (
				<SidebarTrigger
					aria-label="목차 접기 또는 펼치기"
					className="mx-4 mt-4 self-start md:hidden"
					size="icon"
				>
					<SidePanelOpen data-icon="inline-start" />
				</SidebarTrigger>
			)}
			<main className="min-h-0 w-full flex-1">{children}</main>
			{pageNavigation}
		</div>
	)
}
