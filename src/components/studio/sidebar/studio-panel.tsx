'use client'

import type { ReactNode } from 'react'
import { Controller } from '@/components/shared/controller'
import { cn } from '@/lib/utils'

/**
 * Studio 좌·우 패널의 공통 껍데기 — **블록 두 개가 하나의 둥근 테두리로 묶인다**
 * (사용자 지시, 2026-09-10).
 *
 * ```
 * ┌─────────────┐  ← 테두리는 하나
 * │  top        │  ← 남은 높이를 다 먹는다
 * ├─────────────┤
 * │  bottom     │  ← 내용 높이만. 비어 있어도 자리는 남는다
 * └─────────────┘
 * ```
 *
 * 🔴 `header`/`footer` 3슬롯 껍데기(`StudioSidebar`)와 다른 점은 **위 블록이 나뉘지 않는다**는
 *    것이다. 좌측은 「페이지 선택 + 공통」이 한 블록이고, 우측은 「레이어 + 컨트롤러」가 한 블록이다.
 *    그래서 그 안에서 무엇이 늘어날지는 블록을 채우는 쪽이 정한다(우측은 컨트롤러가 h=100%).
 * 🔑 블록에 무엇이 들어가는지 이 컴포넌트는 모른다 — 콘텐츠를 레이아웃에 박지 않는다.
 */
export function StudioPanel({
	slot,
	top,
	bottom,
	className,
}: {
	/**
	 * DOM에서 어느 쪽 패널인지 알려 주는 이름. 🔴 양쪽이 같은 껍데기를 쓰므로 이것이 없으면
	 * 테스트·디버깅에서 좌우를 구별할 수 없다(DOM 순서에 의존하게 된다).
	 */
	slot: 'studio-sidebar' | 'studio-left-panel'
	top: ReactNode
	/**
	 * 아래 블록. 🔴 비어 있어도 **자리를 지킨다** — 「레이아웃과 콘텐츠는 별개」(사용자 지시)라
	 * 두 블록이 하나의 테두리로 묶인 골격은 채울 것이 없을 때도 그대로 보여야 한다.
	 */
	bottom?: ReactNode
	className?: string
}) {
	return (
		// 폭은 셸 열(auto)이 아니라 패널이 소유한다 — 22rem 열 − aside 패딩 32px = 320px 그대로.
		<Controller.Root data-slot={slot} className={cn('lg:w-80', className)}>
			<div
				data-slot="studio-panel-top"
				className="flex min-h-0 flex-1 flex-col overflow-hidden"
			>
				{top}
			</div>
			<div
				data-slot="studio-panel-bottom"
				className="flex shrink-0 flex-col gap-4 border-t border-border px-4 pt-1 pb-4"
			>
				{bottom}
			</div>
		</Controller.Root>
	)
}

/**
 * 패널 블록 안에서 **남은 높이를 먹고 스크롤되는** 영역. 우측의 컨트롤러가 이것이다
 * (「컨트롤러(비어 있을 수도 있음, h=100%)」).
 * 🔴 비어 있어도 자리를 지킨다 — 레이어를 고르지 않았을 때 패널이 줄어들면 안 된다.
 */
export function StudioPanelScroll({ children }: { children: ReactNode }) {
	return (
		<div
			data-slot="studio-panel-scroll"
			// 첫 그룹의 위 경계선은 지운다 — 무엇이 맨 위인지는 그룹이 아니라 이 컨테이너만 안다.
			className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 [&>*:first-child]:border-t-0"
		>
			{children}
		</div>
	)
}

/** 패널 블록 안에서 **높이를 차지한 만큼만** 쓰는 고정 영역. 좌측의 페이지 선택이 이것이다. */
export function StudioPanelFixed({ children }: { children: ReactNode }) {
	return (
		<div data-slot="studio-panel-fixed" className="flex shrink-0 flex-col gap-1 px-4 pt-4 pb-4">
			{children}
		</div>
	)
}
