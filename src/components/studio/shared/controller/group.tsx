'use client'

import { ChevronDown } from '@carbon/icons-react'
import { AnimatePresence, domAnimation, LazyMotion, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import * as React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

type ControllerGroupProps = Omit<
	React.ComponentProps<typeof Collapsible>,
	'title' | 'open' | 'onOpenChange' | 'disabled'
> & {
	title: string
	defaultOpen?: boolean
	/** 잠긴 그룹 — 강제로 닫히고 토글할 수 없다. 풀리면 저장된 열림 상태로 복귀한다. */
	disabled?: boolean
}

/** 제목과 컨트롤을 항상 접히는 섹션으로 묶는다. */
export function ControllerGroup({
	title,
	defaultOpen = true,
	disabled = false,
	className,
	children,
	...props
}: ControllerGroupProps) {
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
			className={cn('flex shrink-0 flex-col border-t border-border pt-1', className)}
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
							<CollapsibleContent forceMount className="flex flex-col gap-1">
								{children}
							</CollapsibleContent>
						</m.div>
					)}
				</AnimatePresence>
			</LazyMotion>
		</Collapsible>
	)
}
