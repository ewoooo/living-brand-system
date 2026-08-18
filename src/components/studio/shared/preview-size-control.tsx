'use client'

import type * as React from 'react'
import { Typography } from '@/components/ui/typography'

export const DEFAULT_PREVIEW_SIZE = 50

/**
 * 출력에는 영향 없이 데스크톱 캔버스의 표시 크기만 조절한다.
 * 떠 있는 자리는 StudioCanvasFooter가 소유한다 — 이 컨트롤은 자기 폭과 트랙만 안다.
 */
export function PreviewSizeControl({
	value,
	onChange,
}: {
	value: number
	onChange: (value: number) => void
}) {
	return (
		<div data-slot="preview-size-control" className="relative w-[233px]">
			<input
				type="range"
				aria-label="프리뷰 크기"
				aria-valuetext={`${value}%`}
				min={25}
				max={100}
				step={5}
				value={value}
				onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
				className="peer absolute top-3 right-3 left-3 z-10 h-9 cursor-ew-resize opacity-0"
			/>
			<div className="relative flex h-9 items-center justify-between overflow-hidden rounded-lg bg-muted px-3 peer-focus-visible:ring-2 peer-focus-visible:ring-ring/30">
				<div
					aria-hidden
					className="absolute inset-y-0 left-0 bg-foreground/10"
					style={{ width: `${value}%` }}
				/>
				<Typography as="span" size="sm" tone="muted" weight="medium" className="relative">
					Preview Size
				</Typography>
				<Typography as="span" size="sm" tone="muted" className="relative font-mono">
					{value}%
				</Typography>
			</div>
		</div>
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
