'use client'

import { Link } from '@carbon/icons-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * 지금 보고 있는 페이지의 링크를 클립보드에 넣는다. 디자인 정본은 Figma HD_LBS_UI 62:5828.
 *
 * 🔑 복사하는 것은 `location.href`라 **in-page 앵커(#page-slug)까지 담긴다** — 목차를 눌러
 *    이동하면 `scrollToGuidelinePage`가 hash를 갱신하므로, 받는 사람이 같은 지점에서 연다.
 *
 * 이 컴포넌트는 도메인을 모른다 — 가이드라인 사이드바가 첫 소비자일 뿐이다.
 */

type CopyState = 'idle' | 'copied' | 'failed'

const LABEL: Record<CopyState, string> = {
	idle: '페이지 링크 복사',
	copied: '링크를 복사했습니다',
	failed: '복사하지 못했습니다',
}

/** 결과 문구가 머무는 시간(ms). 읽고 나면 원래 라벨로 돌아와 다시 누를 수 있어야 한다. */
const RESET_DELAY = 2000

export function CopyPageLink({ className }: { className?: string }) {
	const [state, setState] = useState<CopyState>('idle')
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

	// 언마운트 후 setState를 막는다 — 사이드바가 접히거나 라우트가 바뀌면 이 버튼이 사라진다.
	useEffect(() => () => clearTimeout(timer.current), [])

	async function copy() {
		clearTimeout(timer.current)
		try {
			await navigator.clipboard.writeText(window.location.href)
			setState('copied')
		} catch {
			// 🔴 조용히 실패하면 눌렀는지조차 알 수 없다. clipboard는 보안 컨텍스트가 아니거나
			//    권한이 없으면 거절하므로, 실패도 같은 자리에서 말해 준다.
			setState('failed')
		}
		timer.current = setTimeout(() => setState('idle'), RESET_DELAY)
	}

	return (
		<button
			type="button"
			onClick={copy}
			className={cn(
				'flex w-full items-center gap-2 rounded-md p-2 text-left text-muted-foreground text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30',
				// 접힌 사이드바에서는 아이콘만 남으므로 가운데로 모은다(목차 항목과 같은 규칙).
				'md:max-xl:justify-center xl:group-data-[collapsed=true]/sidebar-api:justify-center',
				className,
			)}
		>
			<Link aria-hidden className="size-4 shrink-0" />
			{/*
			 * 🔴 라벨이 곧 버튼의 이름이고 결과 알림이다. 접혀서 눈에 안 보여도 `sr-only`로 남아
			 *    이름이 사라지지 않으며, `aria-live`가 복사 결과를 그 자리에서 읽어 준다.
			 */}
			<span
				aria-live="polite"
				className="truncate md:max-xl:sr-only xl:group-data-[collapsed=true]/sidebar-api:sr-only"
			>
				{LABEL[state]}
			</span>
		</button>
	)
}
