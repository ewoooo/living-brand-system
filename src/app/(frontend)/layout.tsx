import type React from 'react'
import { GuidelineHeader } from '@/features/guideline/components/global-header'

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

export const metadata = {
	description: 'A blank page',
	title: 'Digital Guideline',
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
				<GuidelineHeader />
				{children}
			</body>
		</html>
	)
}
