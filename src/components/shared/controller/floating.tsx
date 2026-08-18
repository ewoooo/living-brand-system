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
 */
export function FloatingControllerSticky({
	'aria-label': ariaLabel,
	className,
	children,
}: FloatingControllerProps) {
	return (
		<section
			data-slot="floating-controller-sticky"
			aria-label={ariaLabel}
			className={cn(
				'pointer-events-auto flex items-center gap-2 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg',
				className,
			)}
		>
			{children}
		</section>
	)
}
