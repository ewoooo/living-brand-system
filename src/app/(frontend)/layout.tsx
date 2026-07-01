import type { Metadata } from 'next'
import type React from 'react'
import { GlobalAgentChat } from '@/components/global-agent-chat'
import { GlobalHeader } from '@/components/global-header'
import { getGuidelineMetadata } from '@/features/guideline/services/get-guideline-metadata.service'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
			<body className="grid min-h-svh grid-rows-[auto_1fr] bg-white text-black dark:bg-black dark:text-white">
				<GlobalHeader />
				<div className="min-w-0 lg:pr-80">{children}</div>
				<GlobalAgentChat />
			</body>
		</html>
	)
}
