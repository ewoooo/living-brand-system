'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

/** 동적 도판 전체를 판 안에 맞춘다. 캡션·Mark는 축소하지 않는다. */
export function DisplayViewport({ children }: { children: ReactNode }) {
	const viewportRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const [scale, setScale] = useState(1)

	useEffect(() => {
		const viewport = viewportRef.current
		const content = contentRef.current
		if (!viewport || !content) return
		const updateScale = () => {
			if (!content.scrollWidth || !content.scrollHeight) return
			// 가운데 정렬된 큰 자식의 왼쪽 넘침은 부모 scrollWidth에 포함되지 않는다.
			const width = Math.max(
				content.scrollWidth,
				...Array.from(content.children, (child) => child.scrollWidth),
			)
			setScale(
				Math.min(
					1,
					viewport.clientWidth / width,
					viewport.clientHeight / content.scrollHeight,
				),
			)
		}
		const observer = new ResizeObserver(updateScale)
		observer.observe(viewport)
		observer.observe(content)
		for (const child of content.children) observer.observe(child)
		updateScale()
		return () => observer.disconnect()
	}, [])

	return (
		<div ref={viewportRef} data-slot="card-display" className="absolute inset-0 overflow-clip">
			<div
				ref={contentRef}
				className="absolute top-1/2 left-1/2 flex min-h-full w-full items-center justify-center"
				style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
			>
				{children}
			</div>
		</div>
	)
}
