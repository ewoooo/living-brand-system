// 브랜드 가이드 시그니처: 로고 클리어스페이스(여백=x 배수) 다이어그램.
// 점선 경계 = 최소 여백 한계, 로고와 경계 사이 간격 = x. 프레젠테이션 전용.
export function ClearSpace({
	logoSrc,
	alt,
	note,
}: {
	logoSrc: string
	alt: string
	note?: string
}) {
	return (
		<figure className="m-0">
			<div className="grid place-items-center bg-fill-muted p-8 sm:p-14">
				{/* 클리어스페이스 경계(점선). 안쪽 padding이 곧 최소 여백 x. */}
				<div className="relative border border-scrim/30 border-dashed p-10 sm:p-14">
					{/* 여백 크기 라벨 x (상단·좌측 간격에 표기) */}
					<span className="type-caption-1-emphasized -translate-x-1/2 absolute top-1.5 left-1/2 text-foreground-muted">
						x
					</span>
					<span className="type-caption-1-emphasized -translate-y-1/2 absolute top-1/2 left-1.5 text-foreground-muted">
						x
					</span>
					{/* biome-ignore lint/performance/noImgElement: 임의 원격/데이터 URL이라 next/image 미사용. */}
					<img src={logoSrc} alt={alt} className="h-14 w-auto sm:h-20" />
				</div>
			</div>
			{note && (
				<figcaption className="type-callout mt-2 text-foreground-muted">{note}</figcaption>
			)}
		</figure>
	)
}
