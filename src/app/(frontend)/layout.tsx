import type { Metadata } from 'next'
import type React from 'react'
import { GlobalAgentChat } from '@/components/global/chat/global-agent-chat'
import { GlobalHeader } from '@/components/global/header/global-header'
import { ThemeProvider } from '@/components/global/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

import 'streamdown/styles.css'
import './styles.css'

export async function generateMetadata(): Promise<Metadata> {
	const metadata = await getGuidelineMetadata()

	return {
		description: metadata.issuedLabel || metadata.companyName,
		icons: { icon: metadata.faviconHref ?? '/favicons/favicon.png' },
		title: metadata.documentTitle,
	}
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const guidelineNavigation = await getGuidelineNavigation()
	const { metadata } = guidelineNavigation
	const brandColorCss = `${
		metadata.primaryHex && metadata.primaryForegroundHex
			? `:root{--primary:${metadata.primaryHex};--primary-foreground:${metadata.primaryForegroundHex}}`
			: ''
	}${
		metadata.primaryDarkHex && metadata.primaryDarkForegroundHex
			? `.dark{--primary:${metadata.primaryDarkHex};--primary-foreground:${metadata.primaryDarkForegroundHex}}`
			: ''
	}`

	return (
		<html lang="ko" className="scroll-pt-[53px]" suppressHydrationWarning>
			{brandColorCss && (
				<head>
					<style>{brandColorCss}</style>
				</head>
			)}
			<body className="h-svh overflow-hidden bg-background text-foreground">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<TooltipProvider delayDuration={150}>
						<SidebarProvider
							className="h-svh"
							defaultOpen={false}
							storageKey="lbs.agentChatSidebarOpen"
							style={{ '--sidebar-width': '25rem' } as React.CSSProperties}
						>
							{/* 앱 셸은 헤더를 본문 위에 겹치고, main·스크롤은 각 라우트가 소유한다. */}
							<div className="relative min-h-0 min-w-0 flex-1">
								<div className="absolute inset-x-0 top-0 z-50">
									<GlobalHeader
										guidelineChapters={guidelineNavigation.chapters}
									/>
								</div>
								<div className="h-full min-h-0 min-w-0 overflow-hidden">
									{children}
								</div>
								{/*
								 * 테마 전환은 스크롤 위치와 무관하게 항상 닿아야 하므로 셸 좌하단에 띄운다.
								 * fixed가 아니라 absolute인 이유: 에이전트 챗 사이드바가 열리면 이 셸이
								 * 실제로 좁아지므로(sidebar-gap), absolute면 사이드바 상태를 구독하지 않고도
								 * 함께 밀린다. fixed는 뷰포트 기준이라 챗 패널에 덮인다.
								 */}
								<ThemeToggle className="absolute bottom-4 left-4 z-30" />
							</div>
							<GlobalAgentChat />
						</SidebarProvider>
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
