'use client'

import { type PointerEvent, useRef, useState } from 'react'

export const clampControllerValue = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value))

/** Pad·Range가 공유하는 좌클릭 포인터 드래그 배선. */
export function useControllerPointerDrag(
	disabled: boolean | undefined,
	onPoint: (ratioX: number, ratioY: number) => void,
) {
	const [dragging, setDragging] = useState(false)
	const rectRef = useRef<DOMRect | null>(null)

	const point = (event: PointerEvent<HTMLDivElement>) => {
		const bounds = rectRef.current
		// 접힘·전환 중 0 크기 실측은 NaN으로 상태를 오염시키므로 버린다.
		if (!bounds?.width || !bounds?.height) return
		onPoint(
			clampControllerValue((event.clientX - bounds.left) / bounds.width, 0, 1),
			clampControllerValue((event.clientY - bounds.top) / bounds.height, 0, 1),
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
