import type { Metadata } from 'next'
import type React from 'react'
import { GlobalAgentChat } from '@/components/global-agent-chat'
import { GlobalHeader } from '@/components/global-header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

import 'streamdown/styles.css'
import './styles.css'

const themeScript = `
(function () {
  try {
    document.documentElement.classList.toggle(
      "dark",
      localStorage.theme === "dark" ||
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  } catch {}
})();
`

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
		<html lang="en" suppressHydrationWarning>
			<head>
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: fixed theme bootstrap script, no user input.
					dangerouslySetInnerHTML={{
						__html: themeScript,
					}}
				/>
			</head>
			<body className="h-svh overflow-hidden bg-white text-black dark:bg-black dark:text-white">
				<SidebarProvider
					className="h-svh"
					style={{ '--sidebar-width': '25rem' } as React.CSSProperties}
				>
					<main className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr]">
						<GlobalHeader guidelineSections={guidelineNavigation.sections} />
						{/* 남은 높이를 채우고 내부에서만 스크롤한다 (문서 전체 스크롤 아님). */}
						<div className="min-h-0 min-w-0 overflow-hidden">{children}</div>
					</main>
					<GlobalAgentChat />
				</SidebarProvider>
			</body>
		</html>
	)
}
