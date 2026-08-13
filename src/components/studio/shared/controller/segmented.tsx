'use client'

import { domAnimation, LazyMotion, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import * as React from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ControllerOption } from '@/modules/studio-controller/controller-definition'
import { useRowControl } from './row'

type ControllerSegmentedProps<T extends string> = {
	options: readonly ControllerOption<T>[]
	value: T
	onChange: (value: T) => void
	'aria-label': string
	/** 어드민 고정 값 — 포커스·조작이 막힌다. Row 안에서는 행의 disabled를 자동으로 따른다. */
	disabled?: boolean
}

/**
 * 세그먼트 토글(Preset|Generate, Off|On) — dialkit segmented 구조를 그대로 옮겼다:
 * 트랙(relative) 위에 투명 버튼들이 놓이고, 선택 배경은 별도의 pill 하나가
 * 활성 버튼 위치로 미끄러진다(dialkit-segmented-pill). 트랙은 행의 오른끝에서
 * 2px 인셋으로 앉는다(-mr-2.5 = 행 패딩 12px − 2px).
 */
export function ControllerSegmented<T extends string>({
	options,
	value,
	onChange,
	'aria-label': ariaLabel,
	disabled,
}: ControllerSegmentedProps<T>) {
	const row = useRowControl()
	const resolvedDisabled = disabled ?? row?.disabled
	const pillId = React.useId()
	const reducedMotion = useReducedMotion()

	return (
		<div
			data-slot="controller-segmented"
			className="-mr-2.5 flex h-9 shrink-0 items-center py-0.5"
		>
			<LazyMotion features={domAnimation}>
				<ToggleGroup
					type="single"
					value={value}
					// 세그먼트는 항상 하나가 선택돼 있다 — 같은 칩 재클릭(빈 값)은 무시.
					onValueChange={(next) => next && onChange(next as T)}
					aria-label={ariaLabel}
					disabled={resolvedDisabled}
					spacing={0}
					className="h-full"
				>
					{options.map((option) => (
						<ToggleGroupItem
							key={option.value}
							value={option.value}
							size="sm"
							className="relative isolate h-full rounded-sm bg-transparent px-2 text-muted-foreground text-sm transition-colors hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-foreground"
						>
							{option.value === value && (
								<m.span
									aria-hidden
									data-slot="controller-segmented-pill"
									layoutId={pillId}
									className="pointer-events-none absolute inset-0 z-0 rounded-sm bg-foreground/10"
									initial={false}
									transition={
										reducedMotion
											? { duration: 0 }
											: { type: 'spring', visualDuration: 0.2, bounce: 0.15 }
									}
								/>
							)}
							<span className="relative z-10">{option.label}</span>
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</LazyMotion>
		</div>
	)
}
