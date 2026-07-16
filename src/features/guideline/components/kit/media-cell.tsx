// 공유 레이아웃 원자: 이미지 위 + 텍스트 아래. status가 있으면 do/dont 판정 배지를 얹는다.
// ImageTextGrid와 DoDont가 내부적으로 이걸 쓴다(개념은 각자, 레이아웃 조각만 공유).
const kindBadge = {
	do: { symbol: '✓', className: 'bg-foreground text-background' },
	ok: { symbol: '△', className: 'bg-fill-selected text-foreground' },
	dont: { symbol: '✕', className: 'bg-foreground text-background' },
} as const

export type MediaStatus = keyof typeof kindBadge

/**
 * 공유 레이아웃 원자: 이미지 위 + 캡션 아래, status를 주면 우상단에 do/ok/dont 배지.
 * 보통 직접 쓰지 않고 ImageTextGrid·DoDont가 내부적으로 사용한다.
 *
 * @example
 * <MediaCell src={url} caption="충분한 여백을 확보한다." status="do" />
 */
export function MediaCell({
	src,
	alt,
	caption,
	status,
}: {
	/** 이미지 URL. */
	src: string
	/** 대체 텍스트. 생략 시 caption으로 대체. */
	alt?: string
	/** 이미지 하단 캡션(선택). */
	caption?: string
	/** 판정 배지 — 'do'(✓) · 'ok'(△) · 'dont'(✕). 없으면 배지 미표시. */
	status?: MediaStatus
}) {
	return (
		<figure className="m-0 flex flex-col">
			<div className="relative">
				{/* biome-ignore lint/performance/noImgElement: 임의 원격/데이터 URL이라 next/image 미사용. */}
				<img
					src={src}
					alt={alt ?? caption ?? ''}
					className="aspect-4/3 w-full border border-scrim/10 bg-fill-muted object-cover"
				/>
				{status && (
					<span
						aria-hidden
						className={`type-caption-1-emphasized absolute top-2 right-2 grid size-6 place-items-center rounded-full ${kindBadge[status].className}`}
					>
						{kindBadge[status].symbol}
					</span>
				)}
			</div>
			{caption && (
				<figcaption className="type-callout mt-2 text-foreground-muted">
					{caption}
				</figcaption>
			)}
		</figure>
	)
}
