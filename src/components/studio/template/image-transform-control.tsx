'use client'

import { type KeyboardEvent, type PointerEvent, useRef, useState } from 'react'

export type ImageTransformValue = {
	/** 슬롯 중심 기준 오프셋, -1(왼/위) ~ 1(오른/아래). */
	x: number
	y: number
	scale: number
	rotate: number
}

export const IMAGE_TRANSFORM_DEFAULT: ImageTransformValue = { x: 0, y: 0, scale: 1, rotate: 0 }

const SCALE_RANGE = { min: 0.5, max: 2, step: 0.05 }
const ROTATE_RANGE = { min: 0, max: 360, step: 1 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type ImageTransformControlProps = {
	value: ImageTransformValue
	onChange: (value: ImageTransformValue) => void
}

/**
 * 디자인 SSOT(1:1838)의 Image Transform 컨트롤 — 포지션 패드 + Scale·Rotate 슬라이더 행.
 * ponytail: 아직 미리보기 합성에 연결되지 않은 UI-first 컨트롤이다 — 2단계에서 compose의
 * imageTransform 오버라이드에 배선한다(published html에 구워진 transform과의 누적 처리 포함).
 */
export function ImageTransformControl({ value, onChange }: ImageTransformControlProps) {
	return (
		<div data-slot="image-transform-control" className="flex flex-col gap-1 pb-2.5">
			<TransformPad
				x={value.x}
				y={value.y}
				onChange={(x, y) => onChange({ ...value, x, y })}
			/>
			<SliderRow
				label="Scale"
				value={value.scale}
				range={SCALE_RANGE}
				format={(scale) => scale.toFixed(2).replace(/\.?0+$/, '')}
				onChange={(scale) => onChange({ ...value, scale })}
			/>
			<SliderRow
				label="Rotate"
				value={value.rotate}
				range={ROTATE_RANGE}
				format={(rotate) => `${Math.round(rotate)}deg`}
				onChange={(rotate) => onChange({ ...value, rotate })}
			/>
		</div>
	)
}

type TransformPadProps = {
	/** 중심 기준 오프셋, -1(왼/위) ~ 1(오른/아래). */
	x: number
	y: number
	onChange: (x: number, y: number) => void
	ariaLabel?: string
}

/** 2축 포지션 패드 — 드래그와 화살표 키로 위치를 옮긴다. 이미지·그래픽 transform이 공유한다. */
export function TransformPad({ x, y, onChange, ariaLabel = '이미지 위치' }: TransformPadProps) {
	const padRef = useRef<HTMLDivElement>(null)
	const [dragging, setDragging] = useState(false)

	function moveToPointer(event: PointerEvent<HTMLDivElement>) {
		const pad = padRef.current
		if (!pad) return
		const bounds = pad.getBoundingClientRect()
		onChange(
			clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
			clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1),
		)
	}

	function nudge(event: KeyboardEvent<HTMLDivElement>) {
		const step = 0.05
		const deltas: Record<string, [number, number]> = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, -step],
			ArrowDown: [0, step],
		}
		const delta = deltas[event.key]
		if (!delta) return
		event.preventDefault()
		onChange(clamp(x + delta[0], -1, 1), clamp(y + delta[1], -1, 1))
	}

	return (
		// 2축 패드는 단일 값 input range로 표현할 수 없다 — slider role + valuetext로 노출.
		<div
			ref={padRef}
			role="slider"
			aria-label={ariaLabel}
			aria-valuenow={Math.round(x * 100)}
			aria-valuetext={`가로 ${Math.round(x * 100)}%, 세로 ${Math.round(y * 100)}%`}
			tabIndex={0}
			onKeyDown={nudge}
			onPointerDown={(event) => {
				event.currentTarget.setPointerCapture(event.pointerId)
				setDragging(true)
				moveToPointer(event)
			}}
			onPointerMove={(event) => dragging && moveToPointer(event)}
			onPointerUp={() => setDragging(false)}
			className="relative h-36 w-full shrink-0 touch-none rounded-md bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
		>
			{/* 십자선 — 중심 기준 좌표계 표시. */}
			<div aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-border" />
			<div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-border" />
			<div
				aria-hidden
				className="-translate-x-1/2 -translate-y-1/2 absolute size-3.5 rounded-full bg-foreground shadow-sm"
				style={{
					left: `${((x + 1) / 2) * 100}%`,
					top: `${((y + 1) / 2) * 100}%`,
				}}
			/>
		</div>
	)
}

type SliderRowProps = {
	label: string
	value: number
	range: { min: number; max: number; step: number }
	format: (value: number) => string
	onChange: (value: number) => void
}

/** dialkit 슬라이더 행 — 채움 폭이 값이고, 드래그·화살표 키로 조절한다. */
function SliderRow({ label, value, range, format, onChange }: SliderRowProps) {
	const rowRef = useRef<HTMLDivElement>(null)
	const [dragging, setDragging] = useState(false)
	const ratio = (value - range.min) / (range.max - range.min)

	function moveToPointer(event: PointerEvent<HTMLDivElement>) {
		const row = rowRef.current
		if (!row) return
		const bounds = row.getBoundingClientRect()
		const nextRatio = clamp((event.clientX - bounds.left) / bounds.width, 0, 1)
		const raw = range.min + nextRatio * (range.max - range.min)
		onChange(clamp(Math.round(raw / range.step) * range.step, range.min, range.max))
	}

	function nudge(event: KeyboardEvent<HTMLDivElement>) {
		const direction =
			event.key === 'ArrowRight' || event.key === 'ArrowUp'
				? 1
				: event.key === 'ArrowLeft' || event.key === 'ArrowDown'
					? -1
					: 0
		if (!direction) return
		event.preventDefault()
		onChange(clamp(value + direction * range.step, range.min, range.max))
	}

	return (
		// 채움 폭이 곧 값인 dialkit 행 — 시각을 유지하려 input range 대신 slider role.
		<div
			ref={rowRef}
			role="slider"
			aria-label={label}
			aria-valuemin={range.min}
			aria-valuemax={range.max}
			aria-valuenow={value}
			aria-valuetext={format(value)}
			tabIndex={0}
			onKeyDown={nudge}
			onPointerDown={(event) => {
				event.currentTarget.setPointerCapture(event.pointerId)
				setDragging(true)
				moveToPointer(event)
			}}
			onPointerMove={(event) => dragging && moveToPointer(event)}
			onPointerUp={() => setDragging(false)}
			className="relative h-9 w-full shrink-0 cursor-ew-resize touch-none select-none overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
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
