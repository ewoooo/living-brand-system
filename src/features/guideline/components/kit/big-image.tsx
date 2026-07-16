/**
 * 단일 대형 이미지 + 선택 캡션(풀블리드 미디어). 키 비주얼·대표 컷 등 한 장을 크게 보일 때.
 *
 * @example
 * <BigImage src={url} alt="키 비주얼" ratio="wide" caption="풀블리드 대형 이미지." />
 */
export function BigImage({
	src,
	alt,
	caption,
	ratio = 'video',
}: {
	/** 이미지 URL — S3·로컬·data-uri 등 무엇이든. */
	src: string
	/** 대체 텍스트(필수). */
	alt: string
	/** 하단 캡션(선택). */
	caption?: string
	/** 종횡비 — 'video'(16:9, 기본) · 'square'(1:1) · 'wide'(21:9). */
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
				className={`${aspect} w-full border border-scrim/10 bg-fill-muted object-cover`}
			/>
			{caption && (
				<figcaption className="type-callout mt-2 text-foreground-muted">
					{caption}
				</figcaption>
			)}
		</figure>
	)
}
