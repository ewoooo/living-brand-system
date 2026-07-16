'use client'

// 에셋 다운로드용 카본 클릭형 Tile($layer). hover 시 $layer-hover, 우측에 다운로드 화살표.
// 실제 다운로드 로직은 onDownload 콜백에 위임 — 카드 자체는 브랜드/에셋 무관.

export function DownloadCard({
	title,
	format,
	size,
	onDownload,
}: {
	title: string
	format: string
	size: string
	onDownload?: () => void
}) {
	return (
		<button
			type="button"
			onClick={onDownload}
			className="group flex w-full items-center gap-4 rounded-lg bg-background-secondary p-5 text-left outline-none ring-foreground/60 transition-colors hover:bg-fill-hover focus-visible:ring-2"
		>
			<div className="min-w-0 flex-1">
				<p className="type-body-emphasized truncate text-foreground">{title}</p>
				<p className="type-caption-1 mt-1 text-foreground-muted tabular-nums">
					{format} · {size}
				</p>
			</div>
			<span
				aria-hidden
				className="type-title-3 flex size-9 shrink-0 items-center justify-center rounded-full bg-fill-muted text-foreground transition-colors group-hover:bg-background"
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
