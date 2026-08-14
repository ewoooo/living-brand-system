'use client'

import { ChevronDown } from '@carbon/icons-react'
import { AnimatePresence, domAnimation, LazyMotion, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import * as React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

type ControllerGroupProps =
	| (Omit<React.ComponentProps<'section'>, 'title'> & {
			title: string
			collapsible: false
			defaultOpen?: never
			disabled?: never
			attached?: never
	  })
	| (Omit<
			React.ComponentProps<typeof Collapsible>,
			'title' | 'open' | 'onOpenChange' | 'disabled'
	  > & {
			title: string
			collapsible?: true
			defaultOpen?: boolean
			/** 잠긴 그룹 — 강제로 닫히고 토글할 수 없다. 풀리면 저장된 열림 상태로 복귀한다. */
			disabled?: boolean
			/**
			 * 앞 컨트롤을 소유하는 그룹에 붙는 하위 섹션 — 구분선 없이 여백만 둔다(디자인 SSOT 1:1838).
			 * 중첩 자체는 신호가 아니다. 나란한 하위 그룹(Graphic의 Rays·Pulse·Glass)은 구분선을 유지한다.
			 */
			attached?: boolean
	  })

/** 제목과 컨트롤을 묶고, Admin이 허용한 그룹만 접힘 상태를 소유한다. */
export function ControllerGroup(props: ControllerGroupProps) {
	if (props.collapsible !== false) return <ControllerCollapsibleGroup {...props} />

	const { title, collapsible: _collapsible, className, children, ...sectionProps } = props
	return (
		<section
			data-slot="controller-group"
			className={cn('flex shrink-0 flex-col gap-1 pb-3', className)}
			{...sectionProps}
		>
			<header className="flex h-9 shrink-0 items-center pt-1 text-sm font-semibold text-muted-foreground">
				{title}
			</header>
			{children}
		</section>
	)
}

function ControllerCollapsibleGroup({
	title,
	collapsible: _collapsible,
	defaultOpen = true,
	disabled = false,
	attached = false,
	className,
	children,
	...props
}: Exclude<ControllerGroupProps, { collapsible: false }>) {
	// disabled 동안에도 사용자의 열림 의사를 보존한다 — 잠금이 풀리면 원래 상태로 돌아온다.
	const [open, setOpen] = React.useState(defaultOpen)
	const reducedMotion = useReducedMotion()
	const resolvedOpen = disabled ? false : open

	return (
		<Collapsible
			data-slot="controller-group"
			open={resolvedOpen}
			onOpenChange={setOpen}
			disabled={disabled}
			className={cn(
				// 그룹 사이 간격은 컨테이너 gap이 아니라 펼쳐졌을 때의 하단 패딩(12px)이 만든다 — 접힌 그룹은 다음 구분선에 바로 붙는다.
				'flex shrink-0 flex-col border-t border-border pt-1',
				resolvedOpen && 'pb-3',
				attached && 'border-t-0 pt-2',
				className,
			)}
			{...props}
		>
			<LazyMotion features={domAnimation}>
				<CollapsibleTrigger className="flex h-9 w-full items-center justify-between gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50">
					<span className="text-sm font-semibold text-muted-foreground">{title}</span>
					{/* 디자인 SSOT(2:2071): 펼침 = ˅, 접힘 = ˄. */}
					<m.span
						aria-hidden
						className="size-4 shrink-0 text-muted-foreground"
						initial={false}
						animate={{ rotate: resolvedOpen ? 0 : 180 }}
						transition={
							reducedMotion
								? { duration: 0 }
								: { type: 'spring', visualDuration: 0.35, bounce: 0.15 }
						}
					>
						<ChevronDown className="size-4" />
					</m.span>
				</CollapsibleTrigger>
				<AnimatePresence initial={false}>
					{resolvedOpen && (
						<m.div
							data-slot="controller-group-content"
							initial={reducedMotion ? false : { height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0, pointerEvents: 'none' }}
							transition={
								reducedMotion
									? { duration: 0 }
									: { type: 'spring', visualDuration: 0.35, bounce: 0.1 }
							}
							style={{ clipPath: 'inset(0 -20px)' }}
						>
							{/*
							 * 위아래 4px은 바깥 gap이 아니라 여기 패딩이다 — 위 clipPath가 이 박스 끝에서
							 * 세로를 자르므로, 바깥 간격은 첫·마지막 행의 포커스 링(바깥 2px)을 구해 주지
							 * 못한다. 패딩은 접힘 애니메이션이 재는 height 안쪽이라 접혔을 때 새지 않는다.
							 */}
							<CollapsibleContent forceMount className="flex flex-col gap-1 py-1">
								{children}
							</CollapsibleContent>
						</m.div>
					)}
				</AnimatePresence>
			</LazyMotion>
		</Collapsible>
	)
}
