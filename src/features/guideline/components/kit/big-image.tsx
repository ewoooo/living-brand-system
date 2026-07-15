// Carbon 대형 예시(풀블리드 미디어) 이식: 큰 단일 이미지 + 선택 캡션.
// 프레젠테이션 전용 — src는 임의 URL(S3/local/data-uri) 무엇이든 받는다.
export function BigImage({
	src,
	alt,
	caption,
	ratio = 'video',
}: {
	src: string
	alt: string
	caption?: string
	ratio?: 'video' | 'square' | 'wide'
}) {
	const aspect =
		ratio === 'square' ? 'aspect-square' : ratio === 'wide' ? 'aspect-[21/9]' : 'aspect-video'
	return (
		<figure className="m-0">
			{/* biome-ignore lint/performance/noImgElement: 임의 원격/데이터 URL이라 next/image 미사용. */}
			<img
				src={src}
				alt={alt}
				className={`${aspect} w-full rounded-sm border border-scrim/10 bg-fill-muted object-cover`}
			/>
			{caption && (
				<figcaption className="type-callout mt-2 text-foreground-muted">
					{caption}
				</figcaption>
			)}
		</figure>
	)
}
