'use client'

import { Moon, Screen, Sun } from '@carbon/icons-react'
import { useEffect, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

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
		<ToggleGroup
			type="single"
			value={theme}
			aria-label="Theme"
			className="rounded-full bg-muted p-1"
			spacing={1}
			onValueChange={(value) => {
				if (!value) return

				const nextTheme = value as Theme

				setTheme(nextTheme)
				setThemePreference(nextTheme)
			}}
		>
			<ToggleGroupItem
				value="system"
				aria-label="Use system theme"
				className="size-8 rounded-full p-0! data-[state=on]:bg-background data-[state=on]:shadow-xs"
			>
				<Screen data-icon="inline-start" />
			</ToggleGroupItem>
			<ToggleGroupItem
				value="light"
				aria-label="Use light theme"
				className="size-8 rounded-full p-0! data-[state=on]:bg-background data-[state=on]:shadow-xs"
			>
				<Sun data-icon="inline-start" />
			</ToggleGroupItem>
			<ToggleGroupItem
				value="dark"
				aria-label="Use dark theme"
				className="size-8 rounded-full p-0! data-[state=on]:bg-background data-[state=on]:shadow-xs"
			>
				<Moon data-icon="inline-start" />
			</ToggleGroupItem>
		</ToggleGroup>
	)
}
