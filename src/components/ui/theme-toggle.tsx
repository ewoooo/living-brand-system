'use client'

import { Moon, Screen, Sun } from '@carbon/icons-react'
import { useTheme } from 'next-themes'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type Theme = 'light' | 'dark' | 'system'

function isTheme(value: string | undefined): value is Theme {
	return value === 'light' || value === 'dark' || value === 'system'
}

export function ThemeToggle() {
	const { setTheme, theme } = useTheme()
	const value = isTheme(theme) ? theme : 'system'

	return (
		<ToggleGroup
			type="single"
			value={value}
			suppressHydrationWarning
			aria-label="테마"
			className="rounded-full bg-muted p-1"
			spacing={1}
			onValueChange={(value) => {
				if (!value) return
				setTheme(value)
			}}
		>
			<ToggleGroupItem
				value="system"
				aria-label="시스템 테마 사용"
				className="size-8 rounded-full p-0! data-[state=on]:bg-background data-[state=on]:shadow-xs"
			>
				<Screen data-icon="inline-start" />
			</ToggleGroupItem>
			<ToggleGroupItem
				value="light"
				aria-label="라이트 테마 사용"
				className="size-8 rounded-full p-0! data-[state=on]:bg-background data-[state=on]:shadow-xs"
			>
				<Sun data-icon="inline-start" />
			</ToggleGroupItem>
			<ToggleGroupItem
				value="dark"
				aria-label="다크 테마 사용"
				className="size-8 rounded-full p-0! data-[state=on]:bg-background data-[state=on]:shadow-xs"
			>
				<Moon data-icon="inline-start" />
			</ToggleGroupItem>
		</ToggleGroup>
	)
}
