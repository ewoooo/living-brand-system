'use client'

import { Slider as SliderPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

// 🔴 `role="slider"`는 Root가 아니라 손잡이에 붙는다(Radix). 이름·값 서술을 Root에 두면 AT가 읽지 못하므로,
//    호출부가 자연스럽게 쓰는 `<Slider aria-label>`을 여기서 손잡이로 내린다. 이 통로가 없으면 조용히 무명이 된다.
function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	'aria-label': ariaLabel,
	'aria-labelledby': ariaLabelledby,
	'aria-valuetext': ariaValuetext,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
	const _values = React.useMemo(
		() =>
			Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max],
		[value, defaultValue, min, max],
	)

	return (
		<SliderPrimitive.Root
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			className={cn(
				// 손잡이는 절대 배치라 판의 높이에 안 들어간다 — 트랙 4px만 남아 손잡이가 위아래로 삐져나오고
				// 이웃과의 gap이 실제보다 좁게 보인다. 손잡이 지름만큼 바닥을 깔아 박스가 보이는 것과 같아진다.
				'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-horizontal:min-h-4 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track
				data-slot="slider-track"
				className="relative grow overflow-hidden rounded-md bg-muted data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
			>
				<SliderPrimitive.Range
					data-slot="slider-range"
					className="absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full"
				/>
			</SliderPrimitive.Track>
			{Array.from({ length: _values.length }, (_, index) => (
				<SliderPrimitive.Thumb
					data-slot="slider-thumb"
					// biome-ignore lint/suspicious/noArrayIndexKey: 손잡이는 값 배열의 위치 그 자체다 — 순서가 바뀌는 목록이 아니라 인덱스가 정체성이다.
					key={index}
					aria-label={ariaLabel}
					aria-labelledby={ariaLabelledby}
					// ponytail: 손잡이가 여럿이면 전부 같은 이름을 받는다. 리포의 사용처는 전부 단일 손잡이다 —
					// 범위(두 손잡이) 슬라이더가 생기면 손잡이별 이름 배열로 바꾼다.
					aria-valuetext={ariaValuetext}
					// 업스트림은 손잡이를 bg-white로 고정한다. 닫힌 토큰 규칙(09 §4)에 걸리므로 표면 토큰으로 옮겼다 —
					// 손잡이는 트랙 위에 떠 있는 면이고, border-ring이 윤곽을 잡아 두 모드에서 다 읽힌다.
					// 손잡이 16px = Carbon spacing05(= iconSize0). 트랙 4px은 spacing02로 그대로 둔다 —
					// 굵어져야 하는 건 잡는 부분이고 트랙은 값을 읽는 선이다.
					className="relative block size-4 shrink-0 rounded-md border border-ring bg-background ring-ring/30 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-2 focus-visible:ring-2 focus-visible:outline-hidden active:ring-2 disabled:pointer-events-none disabled:opacity-50"
				/>
			))}
		</SliderPrimitive.Root>
	)
}

export { Slider }
