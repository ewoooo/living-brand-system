'use client'

import { domAnimation, LazyMotion, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * 화면 아래에 떠 있는 컨트롤 바 — Figma의 `Helper`(가이드라인)·`Controller API`의 하단 바(스튜디오).
 *
 * 표면이 **둘인 이유는 붙는 방식이 다르기 때문**이다. 이름의 접미사가 그 차이만 말하고, 앞은 같다:
 *
 * | | 붙는 곳 | 쓰는 곳 |
 * | --- | --- | --- |
 * | `FloatingControllerFixed` | 스크롤하지 않는 면(캔버스)에 **박혀** 있다 | Studio |
 * | `FloatingControllerSticky` | 스크롤을 **따라** 내려온다 | 가이드라인 |
 *
 * 🔴 겉모습(모서리·패딩·면)이 서로 다른 것은 지금 상태이지 계약이 아니다. 통일할지는 look 결정이라
 *    사용자가 정한다(`docs/09` §9). 다만 **각각은 한 자리에만 있어야 한다** — 여기 말고 다른 데서
 *    같은 바를 다시 그리지 말 것.
 */

type FloatingControllerProps = {
	/**
	 * 바가 자기 대상에서 DOM상 떨어져 있을 때(portal) 어느 화면의 컨트롤인지 알려주는 유일한 단서다.
	 * 🔴 이름 없는 `region`은 랜드마크로 노출되지 않으므로, 안 주면 그냥 평범한 상자다 —
	 *    role을 조건부로 붙이는 것과 결과가 같고 정적이라 린트가 읽을 수 있다.
	 */
	'aria-label'?: string
	className?: string
	children: ReactNode
}

/** 캔버스처럼 스크롤하지 않는 면 위에 떠 있는 바. 🔴 부모가 `relative`여야 한다. */
export function FloatingControllerFixed({
	'aria-label': ariaLabel,
	className,
	children,
}: FloatingControllerProps) {
	return (
		<section
			data-slot="floating-controller-fixed"
			aria-label={ariaLabel}
			className={cn(
				'-translate-x-1/2 absolute bottom-10 left-1/2 z-10 hidden items-center gap-2 rounded-3xl bg-background p-3 shadow-lg lg:flex',
				className,
			)}
		>
			{children}
		</section>
	)
}

/**
 * 스크롤을 따라 내려오는 바. **자리 상자(sticky)는 호출부가 소유한다** — 이 컴포넌트는 알약만 그린다.
 * 스크롤 컨테이너와 portal 대상을 아는 것은 그 화면이지 바가 아니기 때문이다.
 *
 * 이쪽만 등장 모션을 갖는다. 나타났다 사라졌다 하고 **내용이 통째로 바뀌기** 때문이다 —
 * 아래에서 올라오는 짧은 동작이 "다른 바로 갈아탔다"를 말해 준다. `Fixed`는 캔버스에 늘 떠
 * 있으므로 등장이랄 것이 없다.
 *
 * 🔴 퇴장 모션은 없다. 나가는 바와 들어오는 바는 **서로 다른 블록의 React 트리**에 있어
 *    한 `AnimatePresence`가 둘을 조율할 수 없고, 겹치는 순간 알약 두 개가 나란히 선다.
 *    필요해지면 자리(slot) 쪽에서 두 알약을 같은 칸에 겹쳐 놓는 것이 먼저다.
 */
export function FloatingControllerSticky({
	'aria-label': ariaLabel,
	className,
	children,
}: FloatingControllerProps) {
	const reducedMotion = useReducedMotion()

	return (
		<LazyMotion features={domAnimation}>
			<m.section
				data-slot="floating-controller-sticky"
				aria-label={ariaLabel}
				// 모션 감소에서는 처음부터 제자리다 — `initial={false}`면 animate 상태로 바로 그린다.
				initial={reducedMotion ? false : { opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				// 킷의 다른 모션과 같은 스프링이다(range·segmented) — 한 화면에서 감속이 갈리면 안 된다.
				transition={
					reducedMotion
						? { duration: 0 }
						: { type: 'spring', visualDuration: 0.25, bounce: 0.15 }
				}
				className={cn(
					'pointer-events-auto flex items-center gap-2 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg',
					className,
				)}
			>
				{children}
			</m.section>
		</LazyMotion>
	)
}
