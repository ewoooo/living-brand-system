/**
 * 로고 클리어스페이스(최소 여백=x 배수) 다이어그램 — 로고 주변에 확보해야 할 여백을 시각적으로 보여줄 때.
 * 점선 경계 = 최소 여백 한계, 로고와 경계 사이 간격 = x. 프레젠테이션 전용.
 *
 * @example 기본 — 로고와 최소 여백 다이어그램
 * <ClearSpace logoSrc={url} alt="브랜드 로고" />
 *
 * @example 여백 규칙 설명을 캡션으로
 * <ClearSpace logoSrc={url} alt="브랜드 로고" note="최소 여백은 로고 높이의 절반(x)입니다." />
 */
export function ClearSpace({
	logoSrc,
	alt,
	note,
}: {
	/** 로고 이미지 URL — S3·로컬·data-uri 등 무엇이든. */
	logoSrc: string
	/** 로고 대체 텍스트(접근성). */
	alt: string
	/** 다이어그램 아래 캡션(선택). 여백 규칙 등을 설명. */
	note?: string
}) {
	return (
		<figure className="m-0">
			<div className="grid place-items-center bg-fill-muted p-8 sm:p-14">
				{/* 클리어스페이스 경계(점선). 안쪽 padding이 곧 최소 여백 x. */}
				<div className="relative border border-scrim/30 border-dashed p-10 sm:p-14">
					{/* 여백 크기 라벨 x (상단·좌측 간격에 표기) */}
					<span className="absolute top-1.5 left-1/2 -translate-x-1/2 font-body font-medium text-muted-foreground text-xs">
						x
					</span>
					<span className="absolute top-1/2 left-1.5 -translate-y-1/2 font-body font-medium text-muted-foreground text-xs">
						x
					</span>
					{/* biome-ignore lint/performance/noImgElement: 임의 원격/데이터 URL이라 next/image 미사용. */}
					<img src={logoSrc} alt={alt} className="h-14 w-auto sm:h-20" />
				</div>
			</div>
			{note && (
				<figcaption className="mt-2 font-body font-normal text-muted-foreground text-sm">
					{note}
				</figcaption>
			)}
		</figure>
	)
}
