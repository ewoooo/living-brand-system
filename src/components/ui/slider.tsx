'use client'

import { Slider as SliderPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

// 🔴 `role="slider"`는 Root가 아니라 손잡이에 붙는다(Radix). 이름·값 서술을 Root에 두면 AT가 읽지 못하므로,
//    호출부가 자연스럽게 쓰는 `<Slider aria-label>`을 여기서 손잡이로 내린다. 이 통로가 없으면 조용히 무명이 된다.
// `fill`은 트랙·손잡이 대신 **판 전체가 차오르는** 모양이다(Figma Helper의 Value Range).
// 손잡이를 지우는 것이 아니라 보이지 않게 두는 것이다 — role="slider"와 키보드 조작은 손잡이가 갖고
// 있으므로, 지우면 접근성이 함께 사라진다. 대신 초점은 판 전체의 링으로 드러낸다.
// 판 위에 얹는 라벨·값은 호출부가 `children`으로 넣는다(절대 배치). 슬라이더의 겉모습이 사는
// 한 자리는 이 파일이다(docs/09 §9) — 알약 모양을 위젯 쪽에 다시 만들지 않는다.
function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	variant = 'default',
	children,
	'aria-label': ariaLabel,
	'aria-labelledby': ariaLabelledby,
	'aria-valuetext': ariaValuetext,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { variant?: 'default' | 'fill' }) {
	const fill = variant === 'fill'
	const _values = React.useMemo(
		() =>
			Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max],
		[value, defaultValue, min, max],
	)

	return (
		<SliderPrimitive.Root
			data-slot="slider"
			data-variant={variant}
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			className={cn(
				// 손잡이는 절대 배치라 판의 높이에 안 들어간다 — 트랙 4px만 남아 손잡이가 위아래로 삐져나오고
				// 이웃과의 gap이 실제보다 좁게 보인다. 손잡이 지름만큼 바닥을 깔아 박스가 보이는 것과 같아진다.
				'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-horizontal:min-h-4 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col',
				// 초점 링은 판이 받는다 — 손잡이가 투명해 자기 초점을 보여줄 수 없기 때문이다.
				fill &&
					'h-9 overflow-hidden rounded-lg bg-foreground/5 has-[[data-slot=slider-thumb]:focus-visible]:ring-2 has-[[data-slot=slider-thumb]:focus-visible]:ring-ring',
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track
				data-slot="slider-track"
				className={cn(
					'relative grow overflow-hidden rounded-md bg-muted data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1',
					fill && 'rounded-none bg-transparent data-horizontal:h-full',
				)}
			>
				<SliderPrimitive.Range
					data-slot="slider-range"
					className={cn(
						'absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full',
						fill && 'bg-foreground/10',
					)}
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
					className={cn(
						'relative block size-4 shrink-0 rounded-md border border-ring bg-background ring-ring/30 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-2 focus-visible:ring-2 focus-visible:outline-hidden active:ring-2 disabled:pointer-events-none disabled:opacity-50',
						fill && 'size-px border-0 bg-transparent ring-0 hover:ring-0 active:ring-0',
					)}
				/>
			))}
			{children}
		</SliderPrimitive.Root>
	)
}

export { Slider }
