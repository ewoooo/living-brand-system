'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Theme = 'light' | 'dark' | 'system'

const THEME_LABELS: Record<Theme, string> = {
	light: 'Light',
	dark: 'Dark',
	system: 'System',
}

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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm">
					Theme: {THEME_LABELS[theme]}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Theme</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					value={theme}
					onValueChange={(value) => {
						const nextTheme = value as Theme

						setTheme(nextTheme)
						setThemePreference(nextTheme)
					}}
				>
					<DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
