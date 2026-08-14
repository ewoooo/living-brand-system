'use client'

import { Moon, Screen, Sun } from '@carbon/icons-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

// 이 컨트롤은 페이지 위에 떠 있으므로 자기 면과 윤곽을 갖는다. 트랙은 사이트 배경과 같은
// `bg-background`이고, 경계는 헤더·사이드 nav와 같은 `border-border`가 만든다 — 새 면을 발명하는
// 대신 이미 구분선으로 쓰이는 토큰을 재사용한다. 면을 깔았으면 그 위 상태의 전경도 같이
// 선언해야 하므로(docs/09 §5) 기본 전경만 여기서 정하고, 나머지 두 상태는 base가 가진 것을 그대로 쓴다.
//   기본  : 트랙(background) 위 · text-muted-foreground
//   hover : bg-muted · text-foreground (base 그대로 — 트랙이 background라 더는 트랙과 겹치지 않는다)
//   선택  : bg-primary · text-primary-foreground (base의 채워진 상태 어휘 — toggle.tsx 주석 참조)
// secondary·accent는 두 모드 모두 muted와 같은 값이라 넷째 면으로는 쓸 수 없다.
const ITEM_SURFACE = 'text-muted-foreground'

type Theme = 'light' | 'dark' | 'system'

function isTheme(value: string | undefined): value is Theme {
	return value === 'light' || value === 'dark' || value === 'system'
}

export function ThemeToggle({ className }: { className?: string }) {
	const { setTheme, theme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		// 마운트된 실물과 같은 폭이어야 뜨는 순간 위치가 안 튄다(항목 3 × size-8 + gap·패딩 = 7rem).
		return (
			<div
				aria-hidden
				className={cn(
					'h-10 w-28 rounded-full border border-border bg-background',
					className,
				)}
			/>
		)
	}

	const value = isTheme(theme) ? theme : 'system'

	return (
		<ToggleGroup
			type="single"
			value={value}
			aria-label="테마"
			className={cn('rounded-full border border-border bg-background p-1', className)}
			spacing={1}
			onValueChange={(value) => {
				if (!value) return
				setTheme(value)
			}}
		>
			<ToggleGroupItem
				value="system"
				aria-label="시스템 테마 사용"
				className={cn('size-8 rounded-full p-0!', ITEM_SURFACE)}
			>
				<Screen data-icon="inline-start" />
			</ToggleGroupItem>
			<ToggleGroupItem
				value="light"
				aria-label="라이트 테마 사용"
				className={cn('size-8 rounded-full p-0!', ITEM_SURFACE)}
			>
				<Sun data-icon="inline-start" />
			</ToggleGroupItem>
			<ToggleGroupItem
				value="dark"
				aria-label="다크 테마 사용"
				className={cn('size-8 rounded-full p-0!', ITEM_SURFACE)}
			>
				<Moon data-icon="inline-start" />
			</ToggleGroupItem>
		</ToggleGroup>
	)
}
