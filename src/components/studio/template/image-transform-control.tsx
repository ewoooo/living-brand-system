'use client'

import { type KeyboardEvent, type PointerEvent, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { IMAGE_EDIT_TRANSFORM_LIMITS } from '@/services/compose-template-html.client'

export type ImageTransformValue = {
	/** 슬롯 중심 기준 오프셋, -1(왼/위) ~ 1(오른/아래). */
	x: number
	y: number
	scale: number
	rotate: number
}

export const IMAGE_TRANSFORM_DEFAULT: ImageTransformValue = { x: 0, y: 0, scale: 1, rotate: 0 }

// 어드민과 같은 compose 계약 범위를 소비한다 — step만 이 컨트롤의 UI 밀도다.
const SCALE_RANGE = { ...IMAGE_EDIT_TRANSFORM_LIMITS.scale, step: 0.05 }
const ROTATE_RANGE = { ...IMAGE_EDIT_TRANSFORM_LIMITS.rotate, step: 1 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * 패드 정규 좌표(-1~1)를 compose의 imageTransform(템플릿 px) 값으로 바꾼다.
 * 패드 한끝 = 슬롯 박스 절반 이동. clamp ±1000은 어드민 제스처(clampTransform)와 같은 상한.
 */
export function toImageEditTransform(
	value: ImageTransformValue,
	boxWidth: number,
	boxHeight: number,
): ImageTransformValue {
	const { translate } = IMAGE_EDIT_TRANSFORM_LIMITS
	return {
		x: clamp(Math.round((value.x * boxWidth) / 2), translate.min, translate.max),
		y: clamp(Math.round((value.y * boxHeight) / 2), translate.min, translate.max),
		scale: value.scale,
		rotate: value.rotate,
	}
}

/**
 * 패드·슬라이더가 공유하는 드래그 배선의 단일 소유자.
 * 좌클릭(주 버튼)만 드래그를 시작한다 — 우클릭은 컨텍스트 메뉴로 빠져 pointerup이 안 와
 * dragging이 끼면 이후 맨 호버가 값을 계속 바꾼다. 같은 이유로 cancel·캡처 유실도 종료로 처리한다.
 * rect는 다운 시점 1회 실측을 재사용한다(드래그 중 요소는 움직이지 않고, 매 move 실측은 강제 layout).
 */
function usePointerDrag(
	disabled: boolean | undefined,
	onPoint: (ratioX: number, ratioY: number) => void,
) {
	const [dragging, setDragging] = useState(false)
	const rectRef = useRef<DOMRect | null>(null)

	const point = (event: PointerEvent<HTMLDivElement>) => {
		const bounds = rectRef.current
		// 0 크기 실측(접힘·전환 중)은 나눗셈에서 NaN을 만들어 상태·compose를 오염시킨다 — 버린다.
		if (!bounds?.width || !bounds?.height) return
		onPoint(
			clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
			clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
		)
	}

	const stop = () => setDragging(false)

	return {
		onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
			if (disabled || event.button !== 0) return
			rectRef.current = event.currentTarget.getBoundingClientRect()
			try {
				event.currentTarget.setPointerCapture(event.pointerId)
			} catch {
				// 이미 비활성인 포인터 — 캡처 없이 다운 시점 값만 반영한다.
			}
			setDragging(true)
			point(event)
		},
		onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
			if (dragging) point(event)
		},
		onPointerUp: stop,
		onPointerCancel: stop,
		onLostPointerCapture: stop,
	}
}

type ImageTransformControlProps = {
	value: ImageTransformValue
	onChange: (value: ImageTransformValue) => void
	/** compose가 transform을 배정된 이미지에만 적용하므로, 생성 전에는 비활성으로 둔다. */
	disabled?: boolean
}

/**
 * 디자인 SSOT(1:1838)의 Image Transform 컨트롤 — 포지션 패드 + Scale·Rotate 슬라이더 행.
 * 값은 compose의 imageTransform 오버라이드로 미리보기에 합성된다(패드는 toImageEditTransform으로 px 환산).
 */
export function ImageTransformControl({ value, onChange, disabled }: ImageTransformControlProps) {
	return (
		<div
			data-slot="image-transform-control"
			className={cn(
				'flex flex-col gap-1 pb-2.5',
				disabled && 'pointer-events-none opacity-50',
			)}
		>
			<TransformPad
				x={value.x}
				y={value.y}
				disabled={disabled}
				onChange={(x, y) => onChange({ ...value, x, y })}
			/>
			<SliderRow
				label="Scale"
				value={value.scale}
				range={SCALE_RANGE}
				disabled={disabled}
				format={(scale) => scale.toFixed(2).replace(/\.?0+$/, '')}
				onChange={(scale) => onChange({ ...value, scale })}
			/>
			<SliderRow
				label="Rotate"
				value={value.rotate}
				range={ROTATE_RANGE}
				disabled={disabled}
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
	disabled?: boolean
}

/** 2축 포지션 패드 — 드래그와 화살표 키로 위치를 옮긴다. 이미지·그래픽 transform이 공유한다. */
export function TransformPad({
	x,
	y,
	onChange,
	ariaLabel = '이미지 위치',
	disabled,
}: TransformPadProps) {
	const drag = usePointerDrag(disabled, (ratioX, ratioY) =>
		onChange(ratioX * 2 - 1, ratioY * 2 - 1),
	)

	function nudge(event: KeyboardEvent<HTMLDivElement>) {
		if (disabled) return
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
			role="slider"
			aria-label={ariaLabel}
			aria-valuemin={-100}
			aria-valuemax={100}
			aria-valuenow={Math.round(x * 100)}
			aria-valuetext={`가로 ${Math.round(x * 100)}%, 세로 ${Math.round(y * 100)}%`}
			aria-disabled={disabled || undefined}
			tabIndex={disabled ? -1 : 0}
			onKeyDown={nudge}
			{...drag}
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
	disabled?: boolean
}

/** dialkit 슬라이더 행 — 채움 폭이 값이고, 드래그·화살표 키로 조절한다. */
function SliderRow({ label, value, range, format, onChange, disabled }: SliderRowProps) {
	const ratio = (value - range.min) / (range.max - range.min)
	const drag = usePointerDrag(disabled, (ratioX) => {
		const raw = range.min + ratioX * (range.max - range.min)
		onChange(clamp(Math.round(raw / range.step) * range.step, range.min, range.max))
	})

	function nudge(event: KeyboardEvent<HTMLDivElement>) {
		if (disabled) return
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
			role="slider"
			aria-label={label}
			aria-valuemin={range.min}
			aria-valuemax={range.max}
			aria-valuenow={value}
			aria-valuetext={format(value)}
			aria-disabled={disabled || undefined}
			tabIndex={disabled ? -1 : 0}
			onKeyDown={nudge}
			{...drag}
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
