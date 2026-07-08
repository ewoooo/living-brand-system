import type { Metadata } from 'next'
import Script from 'next/script'
import type React from 'react'
import { GlobalAgentChat } from '@/components/global-agent-chat'
import { GlobalHeader } from '@/components/global-header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'
import { applyTheme } from '@/lib/theme'

import 'streamdown/styles.css'
import './styles.css'

// FOUC 방지용 부트스트랩 — applyTheme(단일 원본)을 문자열화해 하이드레이션 전에 실행한다.
const themeScript = `try{(${applyTheme.toString()})()}catch{}`

export async function generateMetadata(): Promise<Metadata> {
	const metadata = await getGuidelineMetadata()

	return {
		description: metadata.issuedLabel || metadata.companyName,
		icons: metadata.faviconHref ? { icon: metadata.faviconHref } : undefined,
		title: metadata.documentTitle,
	}
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const guidelineNavigation = await getGuidelineNavigation()

	return (
		<html lang="ko" suppressHydrationWarning>
			<body className="h-svh overflow-hidden bg-white text-black dark:bg-black dark:text-white">
				{/* 테마 부트스트랩 — 하이드레이션 전에 실행해 FOUC 방지. next/script로 렌더해 React의 raw script 경고를 피한다. */}
				<Script id="theme-bootstrap" strategy="beforeInteractive">
					{themeScript}
				</Script>
				<SidebarProvider
					className="h-svh"
					defaultOpen={false}
					storageKey="lbs.agentChatSidebarOpen"
					style={{ '--sidebar-width': '25rem' } as React.CSSProperties}
				>
					{/* 앱 셸(헤더 + 본문 그리드) — main 랜드마크는 각 라우트의 본문이 소유한다. */}
					<div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr]">
						<GlobalHeader guidelineSections={guidelineNavigation.sections} />
						{/* 남은 높이를 채우고 내부에서만 스크롤한다 (문서 전체 스크롤 아님). */}
						<div className="min-h-0 min-w-0 overflow-hidden">{children}</div>
					</div>
					<GlobalAgentChat />
				</SidebarProvider>
			</body>
		</html>
	)
}
