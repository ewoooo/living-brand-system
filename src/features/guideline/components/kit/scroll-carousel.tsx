'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

/**
 * 세로 스크롤 → 가로 슬라이드 캐러셀. 컴포넌트가 자체 스크롤 영역을 소유하므로 어느 페이지에 붙여도
 * (문서 스크롤/중첩 스크롤 무관) 동일하게 동작하는 self-contained 프로토타입. 폭 전체를 채운다.
 *
 * @example
 * <ScrollCarousel slides={[{ id: 's1', image: url, caption: '01 · Intro' }]} />
 */
export type ScrollSlide = {
	/** 안정적 key. */
	id: string
	/** 슬라이드 배경 이미지 — data-URI·원격 URL 무엇이든. */
	image: string
	/** 좌하단 캡션(선택). */
	caption?: string
}

export function ScrollCarousel({
	slides,
	/** 스크롤 스테이지 높이. 기본 70vh. */
	height = '70vh',
}: {
	slides: ScrollSlide[]
	height?: string
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const { scrollYProgress } = useScroll({ container: containerRef })
	const count = Math.max(slides.length, 1)
	// translateX는 트랙(자기) 폭 기준 %. 마지막 슬라이드가 화면 끝에 닿도록 (count-1)/count.
	const x = useTransform(scrollYProgress, [0, 1], ['0%', `-${((count - 1) / count) * 100}%`])

	return (
		<div className="w-full">
			<div
				ref={containerRef}
				className="relative w-full overflow-y-auto overscroll-contain rounded-lg border border-border"
				style={{ height }}
			>
				{/* 세로 스크롤 거리 생성용 스페이서: 슬라이드 수 × 스테이지 높이. */}
				<div style={{ height: `${count * 100}%` }}>
					<div className="sticky top-0 overflow-hidden" style={{ height }}>
						<motion.div className="flex h-full" style={{ width: `${count * 100}%`, x }}>
							{slides.map((slide) => (
								<div
									key={slide.id}
									className="relative h-full flex-none"
									style={{ width: `${100 / count}%` }}
								>
									{/* biome-ignore lint/performance/noImgElement: 임의 data-URI/원격이라 next/image 미사용. */}
									<img
										src={slide.image}
										alt={slide.caption ?? ''}
										className="h-full w-full object-cover"
									/>
									{slide.caption && (
										<span className="absolute bottom-5 left-5 rounded bg-scrim/70 px-3 py-1.5 font-body font-medium text-scrim-foreground text-sm">
											{slide.caption}
										</span>
									)}
								</div>
							))}
						</motion.div>
					</div>
				</div>
			</div>
			<p className="mt-2 font-body font-normal text-muted-foreground text-xs">
				↓ 위 영역 안에서 세로로 스크롤하면 슬라이드가 가로로 넘어갑니다.
			</p>
		</div>
	)
}

// 프로토타입용 mock 슬라이드(브랜드 무관 컬러 패널).
const panel = (label: string, bg: string, fg: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="${bg}"/><text x="80" y="470" font-family="sans-serif" font-size="200" font-weight="800" fill="${fg}">${label}</text></svg>`,
	)}`

export function ScrollCarouselDemo() {
	return (
		<ScrollCarousel
			slides={[
				{ id: 'c1', image: panel('01', '#1f6f5c', '#eafff6'), caption: '01 · Origin' },
				{ id: 'c2', image: panel('02', '#0f766e', '#e6fffb'), caption: '02 · Craft' },
				{ id: 'c3', image: panel('03', '#155e63', '#e0fbff'), caption: '03 · Care' },
				{ id: 'c4', image: panel('04', '#1e3a34', '#eafff6'), caption: '04 · Future' },
			]}
		/>
	)
}
