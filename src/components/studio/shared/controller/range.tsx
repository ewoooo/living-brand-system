'use client'

import type { KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { clampControllerValue, useControllerPointerDrag } from './pointer-drag'

type ControllerRangeProps = {
	label: string
	value: number
	min: number
	max: number
	step: number
	format?: (value: number) => string
	onChange: (value: number) => void
	disabled?: boolean
	className?: string
}

/** Figma Controller API의 단일 Value Range — 채움 폭과 화살표 키로 값을 표현한다. */
export function ControllerRange({
	label,
	value,
	min,
	max,
	step,
	format = String,
	onChange,
	disabled,
	className,
}: ControllerRangeProps) {
	const span = max - min
	const ratio = span > 0 ? clampControllerValue((value - min) / span, 0, 1) : 0
	const resolvedDisabled = disabled || span <= 0 || step <= 0
	const drag = useControllerPointerDrag(resolvedDisabled, (ratioX) => {
		const raw = min + ratioX * span
		onChange(clampControllerValue(min + Math.round((raw - min) / step) * step, min, max))
	})

	function nudge(event: KeyboardEvent<HTMLDivElement>) {
		if (resolvedDisabled) return
		const direction =
			event.key === 'ArrowRight' || event.key === 'ArrowUp'
				? 1
				: event.key === 'ArrowLeft' || event.key === 'ArrowDown'
					? -1
					: 0
		if (!direction) return
		event.preventDefault()
		onChange(clampControllerValue(value + direction * step, min, max))
	}

	return (
		<div
			data-slot="controller-range"
			role="slider"
			aria-label={label}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-valuetext={format(value)}
			aria-disabled={resolvedDisabled || undefined}
			tabIndex={resolvedDisabled ? -1 : 0}
			onKeyDown={nudge}
			{...drag}
			className={cn(
				'relative h-9 w-full shrink-0 cursor-ew-resize touch-none select-none overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
				resolvedDisabled && 'pointer-events-none opacity-50',
				className,
			)}
		>
			<div
				aria-hidden
				className="absolute inset-y-0 left-0 bg-foreground/10"
				style={{ width: `${ratio * 100}%` }}
			/>
			<div className="relative flex h-full items-center justify-between px-3">
				<span className="text-sm text-muted-foreground">{label}</span>
				<span className="font-mono text-sm text-muted-foreground">{format(value)}</span>
			</div>
		</div>
	)
}
