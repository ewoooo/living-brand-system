'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

function applyTheme() {
	document.documentElement.classList.toggle(
		'dark',
		localStorage.theme === 'dark' ||
			(!('theme' in localStorage) &&
				window.matchMedia('(prefers-color-scheme: dark)').matches),
	)
}

function getTheme(): Theme {
	return localStorage.theme === 'light' || localStorage.theme === 'dark'
		? localStorage.theme
		: 'system'
}

function setThemePreference(theme: Theme) {
	if (theme === 'system') {
		localStorage.removeItem('theme')
	} else {
		localStorage.theme = theme
	}

	applyTheme()
}

export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>('system')

	useEffect(() => {
		const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')

		setTheme(getTheme())
		systemTheme.addEventListener('change', applyTheme)

		return () => systemTheme.removeEventListener('change', applyTheme)
	}, [])

	return (
		<label className="inline-flex items-center gap-2 text-sm">
			Theme
			<select
				className="rounded border border-neutral-300 bg-white px-2 py-1 text-black dark:border-neutral-700 dark:bg-black dark:text-white"
				value={theme}
				onChange={(event) => {
					const nextTheme = event.target.value as Theme

					setTheme(nextTheme)
					setThemePreference(nextTheme)
				}}
			>
				<option value="light">Light</option>
				<option value="dark">Dark</option>
				<option value="system">System</option>
			</select>
		</label>
	)
}
