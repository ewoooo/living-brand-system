'use client'

import { useEffect, useId, useState } from 'react'

// 이미지 슬라이드 캐러셀: prev/next + 닷 인디케이터. 인덱스 기반 translateX 트랙(경계 없음).
// autoPlay=true면 자동 슬라이드(호버 시 정지, prefers-reduced-motion 존중).
export type CarouselSlide = {
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
		<div
			className="flex flex-col gap-4"
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
		>
			<div className={`group relative overflow-hidden bg-fill-muted ${aspect}`}>
				<div
					className="flex h-full transition-transform duration-500 ease-out"
					style={{ transform: `translateX(-${index * 100}%)` }}
				>
					{slides.map((slide) => (
						<div key={slide.caption ?? slide.image} className="h-full w-full shrink-0">
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
				<p className="type-callout text-foreground-muted" id={labelId}>
					{slides[index]?.caption}
				</p>
				<div className="flex shrink-0 gap-2">
					{slides.map((slide, dotIndex) => (
						<button
							key={slide.caption ?? slide.image}
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
		</div>
	)
}

const slide = (label: string, color: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="${color}"/><text x="480" y="290" font-family="sans-serif" font-size="40" font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text></svg>`,
	)}`

export function CarouselDemo() {
	return (
		<Carousel
			autoPlay
			slides={[
				{
					image: slide('Key Visual 01', '#262626'),
					caption: '메인 키 비주얼 — 식물성 원료의 생명력.',
				},
				{ image: slide('Ampoule', '#525252'), caption: '앰플 제품 라인 대표 컷.' },
				{ image: slide('Ritual', '#404040'), caption: '데일리 스킨케어 루틴 시리즈.' },
				{ image: slide('Seasonal', '#737373'), caption: '시즌 캠페인 키 비주얼.' },
			]}
		/>
	)
}
