'use client'

import { type PointerEvent as ReactPointerEvent, useCallback, useRef, useState } from 'react'
import layoutBaseImage from './images/layout_base_image_1.webp'
import layoutBaseImage2 from './images/layout_base_image_2.webp'

/**
 * Do / Don't 비교 슬라이더 — 같은 구도의 정상(Do) 이미지와 위반(Don't) 이미지를 겹쳐놓고,
 * 가운데 핸들을 드래그하면 그 경계로 두 이미지를 갈라 보여준다. 정지된 종이(PDF)로는 못 하는
 * "같은 자리에서 옳고 그름을 직접 문질러 비교"하는 웹 전용 인터랙션이다.
 *
 * 브랜드 무관: 두 이미지 + 라벨만 데이터로 받는다. 실제 사용에선 디자이너가 같은 레이아웃의
 * 정상본/위반본 두 렌더를 넣는다(여기 데모는 kit 샘플 이미지 두 장).
 *
 * 접근성: role="slider" + 좌우 화살표 키로 경계 이동(마우스 없이도 조작).
 *
 * @example
 * <DoDontCompare correctSrc={ok} wrongSrc={ng} correctLabel="Do" wrongLabel="Don't" />
 */
export function DoDontCompare({
	correctSrc,
	wrongSrc,
	correctLabel = 'Do',
	wrongLabel = "Don't",
	correctCaption,
	wrongCaption,
	ratio = '4 / 3',
}: {
	correctSrc: string
	wrongSrc: string
	correctLabel?: string
	wrongLabel?: string
	correctCaption?: string
	wrongCaption?: string
	/** aspect-ratio CSS 값(예: '4 / 3', '16 / 9'). */
	ratio?: string
}) {
	const [pos, setPos] = useState(50)
	const frameRef = useRef<HTMLDivElement>(null)
	const dragging = useRef(false)

	const setFromClientX = useCallback((clientX: number) => {
		const frame = frameRef.current
		if (!frame) return
		const { left, width } = frame.getBoundingClientRect()
		const pct = ((clientX - left) / width) * 100
		setPos(Math.min(100, Math.max(0, pct)))
	}, [])

	const onPointerDown = (event: ReactPointerEvent) => {
		dragging.current = true
		event.currentTarget.setPointerCapture(event.pointerId)
		setFromClientX(event.clientX)
	}
	const onPointerMove = (event: ReactPointerEvent) => {
		if (!dragging.current) return
		setFromClientX(event.clientX)
	}
	const onPointerUp = () => {
		dragging.current = false
	}

	return (
		<figure className="w-full">
			<div
				ref={frameRef}
				className="relative w-full touch-none select-none overflow-hidden rounded-lg bg-muted"
				style={{ aspectRatio: ratio }}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
			>
				{/* 아래 레이어: 위반(Don't) — 전체 */}
				{/* biome-ignore lint/performance/noImgElement: kit 로컬 정적 에셋이라 next/image 미사용. */}
				<img
					src={wrongSrc}
					alt={wrongCaption || wrongLabel}
					className="absolute inset-0 size-full object-cover"
					draggable={false}
				/>
				{/* 위 레이어: 정상(Do) — 경계 왼쪽만 노출 */}
				{/* biome-ignore lint/performance/noImgElement: kit 로컬 정적 에셋이라 next/image 미사용. */}
				<img
					src={correctSrc}
					alt={correctCaption || correctLabel}
					className="absolute inset-0 size-full object-cover"
					style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
					draggable={false}
				/>

				<Badge kind="do" label={correctLabel} className="top-3 left-3" hidden={pos < 12} />
				<Badge kind="dont" label={wrongLabel} className="top-3 right-3" hidden={pos > 88} />

				{/* 경계선 + 핸들 */}
				<div
					className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-background shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
					style={{ left: `${pos}%` }}
				>
					<div
						role="slider"
						tabIndex={0}
						aria-label="Do/Don't 비교 경계"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round(pos)}
						onKeyDown={(event) => {
							if (event.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 4))
							if (event.key === 'ArrowRight') setPos((p) => Math.min(100, p + 4))
						}}
						className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-background text-foreground shadow-md ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-foreground"
					>
						<span aria-hidden className="font-body text-xs">
							◄►
						</span>
					</div>
				</div>
			</div>

			{(correctCaption || wrongCaption) && (
				<figcaption className="mt-3 grid grid-cols-2 gap-4 font-body text-sm">
					<span className="text-green-800">{correctCaption}</span>
					<span className="text-right text-destructive">{wrongCaption}</span>
				</figcaption>
			)}
		</figure>
	)
}

function Badge({
	kind,
	label,
	className,
	hidden,
}: {
	kind: 'do' | 'dont'
	label: string
	className?: string
	hidden?: boolean
}) {
	const style =
		kind === 'do'
			? 'bg-green-500/90 text-white'
			: 'bg-destructive/90 text-destructive-foreground'
	return (
		<span
			className={`pointer-events-none absolute inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body font-medium text-xs transition-opacity ${style} ${className ?? ''} ${hidden ? 'opacity-0' : 'opacity-100'}`}
		>
			<span aria-hidden>{kind === 'do' ? '✓' : '✕'}</span>
			{label}
		</span>
	)
}

export function DoDontCompareDemo() {
	return (
		<DoDontCompare
			correctSrc={layoutBaseImage.src}
			wrongSrc={layoutBaseImage2.src}
			correctLabel="Do"
			wrongLabel="Don't"
			correctCaption="지정 여백·정렬을 지킨 레이아웃."
			wrongCaption="여백을 무시하고 요소를 가장자리에 붙인 예."
			ratio="16 / 9"
		/>
	)
}
