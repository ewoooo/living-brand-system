import type { Metadata } from 'next'
import type React from 'react'
import { GlobalAgentChat } from '@/components/global/chat/global-agent-chat'
import { GlobalHeader } from '@/components/global/header/global-header'
import { ThemeProvider } from '@/components/global/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
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
		<html lang="ko" suppressHydrationWarning>
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
					<SidebarProvider
						className="h-svh"
						defaultOpen={false}
						storageKey="lbs.agentChatSidebarOpen"
						style={{ '--sidebar-width': '25rem' } as React.CSSProperties}
					>
						{/* 앱 셸(헤더 + 본문 그리드) — main 랜드마크는 각 라우트의 본문이 소유한다. */}
						<div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr]">
							<GlobalHeader guidelineChapters={guidelineNavigation.chapters} />
							{/* 남은 높이를 채우고 내부에서만 스크롤한다 (문서 전체 스크롤 아님). */}
							<div className="min-h-0 min-w-0 overflow-hidden">{children}</div>
						</div>
						<GlobalAgentChat />
					</SidebarProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
