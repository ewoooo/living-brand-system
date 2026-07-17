'use client'

/**
 * 에셋 다운로드용 클릭형 타일 — 로고 팩·팔레트·폰트 등 내려받기 항목 한 줄에 드롭인.
 * hover 시 배경 강조, 우측에 다운로드 화살표. 실제 다운로드 로직은 onDownload 콜백에 위임하고
 * 카드 자체는 브랜드/에셋 무관.
 *
 * @example 단일 카드
 * <DownloadCard title="로고 팩 (AI · SVG · PNG)" format="ZIP" size="4.2MB" onDownload={() => download(url)} />
 *
 * @example 그리드로 여러 개
 * <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
 *   <DownloadCard title="Color Palette" format="ASE" size="48KB" onDownload={() => download(url)} />
 * </div>
 */
export function DownloadCard({
	title,
	format,
	size,
	onDownload,
}: {
	/** 에셋 이름 — 굵게 표시되는 제목. */
	title: string
	/** 파일 포맷 라벨(예: 'ZIP', 'OTF'). 캡션에 'format · size'로 노출. */
	format: string
	/** 파일 크기 표기 문자열(예: '4.2MB'). 캡션에 'format · size'로 노출. */
	size: string
	/** 타일 클릭 시 호출 — 실제 다운로드 트리거를 여기서 처리한다. */
	onDownload?: () => void
}) {
	return (
		<button
			type="button"
			onClick={onDownload}
			className="group flex w-full items-center gap-4 rounded-lg bg-background-secondary p-5 text-left outline-none ring-foreground/60 transition-colors hover:bg-fill-hover focus-visible:ring-2"
		>
			<div className="min-w-0 flex-1">
				<p className="truncate font-body font-semibold text-base text-foreground">
					{title}
				</p>
				<p className="mt-1 font-body font-normal text-muted-foreground text-xs tabular-nums">
					{format} · {size}
				</p>
			</div>
			<span
				aria-hidden
				className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill-muted font-body font-normal text-lg text-foreground transition-colors group-hover:bg-background"
			>
				↓
			</span>
		</button>
	)
}

const assets = [
	{ title: '로고 팩 (AI · SVG · PNG)', format: 'ZIP', size: '4.2MB' },
	{ title: 'Color Palette · Essenherb Red', format: 'ASE', size: '48KB' },
	{ title: 'Signature Font · Essen Flux', format: 'OTF', size: '1.1MB' },
]

export function DownloadCardDemo() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			{assets.map((asset) => (
				<DownloadCard
					key={asset.title}
					title={asset.title}
					format={asset.format}
					size={asset.size}
				/>
			))}
		</div>
	)
}
