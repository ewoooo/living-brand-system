'use client'

import { useEffect, useId, useState } from 'react'

// 이미지 슬라이드 캐러셀: prev/next + 닷 인디케이터. 인덱스 기반 translateX 트랙(경계 없음).
// autoPlay=true면 자동 슬라이드(호버 시 정지, prefers-reduced-motion 존중).
export type CarouselSlide = {
	/** Payload 배열 행처럼 슬라이드에 안정적인 식별자가 있으면 렌더 key로 사용한다. */
	id?: string
	/** 슬라이드 이미지 URL — S3·로컬·data-uri 등 무엇이든. */
	image: string
	/** 대체 텍스트(선택). 없으면 caption을, 그것도 없으면 빈 문자열을 alt로 쓴다. */
	alt?: string
	/** 슬라이드 하단 캡션(선택). 현재 슬라이드 것만 표시된다. */
	caption?: string
}

/**
 * 이미지 슬라이드 캐러셀 — 좌우 화살표 + 닷 인디케이터로 한 장씩 넘긴다.
 * 같은 성격의 사용 예시가 여럿일 때(사용예시 여러 컷 등) 한 프레임에 모아 보여주는 용도.
 *
 * @example 정적 캐러셀 — 사용자가 직접 넘김
 * <Carousel slides={[{ image: url, caption: '앰플 대표 컷.' }, { image: url, caption: '루틴 시리즈.' }]} />
 *
 * @example 자동 재생 — 호버 시 정지, prefers-reduced-motion 존중
 * <Carousel autoPlay interval={5000} slides={[{ image: url, alt: '키 비주얼' }, { image: url }]} />
 */
export function Carousel({
	slides,
	aspect = 'aspect-video',
	autoPlay = false,
	interval = 4000,
}: {
	/** 표시할 슬라이드 배열. 0장이면 아무것도 렌더링하지 않는다. */
	slides: CarouselSlide[]
	/** 이미지 프레임 종횡비 Tailwind 클래스(기본 'aspect-video'). */
	aspect?: string
	/** true면 자동 슬라이드(호버 시 정지, prefers-reduced-motion이면 미작동). 기본 false. */
	autoPlay?: boolean
	/** 자동 재생 간격(ms). autoPlay=true일 때만 의미 있음. 기본 4000. */
	interval?: number
}) {
	const [index, setIndex] = useState(0)
	const [paused, setPaused] = useState(false)
	const labelId = useId()
	const count = slides.length

	useEffect(() => {
		if (!autoPlay || paused || count <= 1) return
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
		const id = window.setInterval(() => setIndex((i) => (i + 1) % count), interval)
		return () => window.clearInterval(id)
	}, [autoPlay, paused, count, interval])

	if (count === 0) return null
	const go = (next: number) => setIndex((next + count) % count)

	return (
		<section
			className="flex flex-col gap-4"
			aria-roledescription="carousel"
			aria-label="이미지 캐러셀"
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onFocus={() => setPaused(true)}
			onBlur={() => setPaused(false)}
		>
			<div className={`group relative overflow-hidden bg-fill-muted ${aspect}`}>
				<div
					className="flex h-full transition-transform duration-500 ease-out"
					style={{ transform: `translateX(-${index * 100}%)` }}
				>
					{slides.map((slide) => (
						<div
							key={slide.id ?? slide.caption ?? slide.image}
							className="h-full w-full shrink-0"
						>
							{/* biome-ignore lint/performance/noImgElement: 임의 원격/데이터 URL이라 next/image 미사용. */}
							<img
								src={slide.image}
								alt={slide.alt ?? slide.caption ?? ''}
								className="h-full w-full object-cover"
							/>
						</div>
					))}
				</div>

				<button
					type="button"
					onClick={() => go(index - 1)}
					aria-label="이전 슬라이드"
					className="-translate-y-1/2 absolute top-1/2 left-3 grid size-9 place-items-center rounded-full bg-scrim/40 text-scrim-foreground opacity-0 backdrop-blur-sm transition-opacity hover:bg-scrim/60 focus-visible:opacity-100 group-hover:opacity-100"
				>
					‹
				</button>
				<button
					type="button"
					onClick={() => go(index + 1)}
					aria-label="다음 슬라이드"
					className="-translate-y-1/2 absolute top-1/2 right-3 grid size-9 place-items-center rounded-full bg-scrim/40 text-scrim-foreground opacity-0 backdrop-blur-sm transition-opacity hover:bg-scrim/60 focus-visible:opacity-100 group-hover:opacity-100"
				>
					›
				</button>
			</div>

			<div className="flex items-center justify-between gap-4">
				<p className="font-body text-sm font-normal text-muted-foreground" id={labelId}>
					{slides[index]?.caption}
				</p>
				<div className="flex shrink-0 gap-2">
					{slides.map((slide, dotIndex) => (
						<button
							key={slide.id ?? slide.caption ?? slide.image}
							type="button"
							onClick={() => go(dotIndex)}
							aria-label={`${dotIndex + 1}번째 슬라이드로 이동`}
							aria-current={dotIndex === index}
							className={`size-2 rounded-full transition-colors ${
								dotIndex === index
									? 'bg-foreground'
									: 'bg-fill-selected hover:bg-foreground-muted'
							}`}
						/>
					))}
				</div>
			</div>
		</section>
	)
}
