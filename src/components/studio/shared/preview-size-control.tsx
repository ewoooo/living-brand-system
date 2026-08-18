'use client'

import type * as React from 'react'
import { ControllerRange } from '@/components/studio/shared/controller'

export const DEFAULT_PREVIEW_SIZE = 50

/**
 * 출력에는 영향 없이 데스크톱 캔버스의 표시 크기만 조절한다.
 * 트랙·채움·키보드는 킷의 Value Range 프리미티브가 소유한다(docs/10 §3.6) — 여기서는
 * 이 컨트롤이 무엇을 재는지(라벨·범위·표기)만 고정한다.
 * 떠 있는 자리는 StudioCanvasFooter가 갖는다.
 */
export function PreviewSizeControl({
	value,
	onChange,
}: {
	value: number
	onChange: (value: number) => void
}) {
	return (
		<ControllerRange
			label="Preview Size"
			value={value}
			min={25}
			max={100}
			step={5}
			format={(size) => `${size}%`}
			onChange={onChange}
			className="w-48"
		/>
	)
}

/**
 * 캔버스 아래 떠 있는 컨트롤 바. 자리와 표면만 소유하고 무엇이 들어가는지는 모른다.
 * Template·Graphic은 프리뷰 크기 하나만, 검수는 파일 이동·보기 전환을 함께 싣는다.
 * 부모가 `relative`여야 한다.
 */
export function StudioCanvasFooter({ children }: { children: React.ReactNode }) {
	return (
		<div
			data-slot="studio-canvas-footer"
			className="absolute bottom-10 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-3xl bg-background p-3 shadow-lg lg:flex"
		>
			{children}
		</div>
	)
}
