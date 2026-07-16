'use client'

import { useId, useState } from 'react'

// 이미지 슬라이드 캐러셀: prev/next + 닷 인디케이터. 인덱스 기반 translateX 트랙(경계 없음).
export type CarouselSlide = { image: string; alt?: string; caption?: string }

export function Carousel({
	slides,
	aspect = 'aspect-video',
}: {
	slides: CarouselSlide[]
	aspect?: string
}) {
	const [index, setIndex] = useState(0)
	const labelId = useId()
	const count = slides.length
	if (count === 0) return null
	const go = (next: number) => setIndex((next + count) % count)

	return (
		<div className="flex flex-col gap-4">
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
