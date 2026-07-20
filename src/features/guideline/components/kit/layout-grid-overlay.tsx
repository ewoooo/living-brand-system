'use client'

import { useState } from 'react'

/**
 * 레이아웃 그리드 오버레이 — 인쇄물/아트워크 위에 컬럼 그리드를 on/off 토글로 겹쳐 보이게 하는 프로토타입.
 * 그리드가 실제 배치와 맞는지 눈으로 검수한다. 브랜드 무관: 아트워크·그리드 스펙 전부 props.
 *
 * @example
 * <LayoutGridOverlay artwork={url} columns={12} gutterPct={2} marginPct={6} />
 */
export function LayoutGridOverlay({
	artwork,
	columns = 12,
	/** 컬럼 사이 거터(컨테이너 폭 %). */
	gutterPct = 2,
	/** 좌우 마진(컨테이너 폭 %). */
	marginPct = 6,
	/** 대지 종횡비(CSS aspect-ratio). */
	ratio = '3 / 4',
}: {
	artwork: string
	columns?: number
	gutterPct?: number
	marginPct?: number
	ratio?: string
}) {
	const [show, setShow] = useState(true)
	const columnIds = Array.from({ length: columns }, (_, i) => `col-${i}`)

	return (
		<div className="w-full">
			<button
				type="button"
				onClick={() => setShow((s) => !s)}
				aria-pressed={show}
				className="mb-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm hover:bg-fill-hover"
			>
				<span
					className={`h-2.5 w-2.5 rounded-full ${show ? 'bg-foreground' : 'bg-border'}`}
				/>
				그리드 {show ? '켜짐' : '꺼짐'}
			</button>
			<div
				className="relative mx-auto max-w-md overflow-hidden rounded-lg border border-border"
				style={{ aspectRatio: ratio }}
			>
				{/* biome-ignore lint/performance/noImgElement: 임의 data-URI/원격이라 next/image 미사용. */}
				<img src={artwork} alt="아트워크" className="h-full w-full object-cover" />
				{show && (
					<div
						className="absolute inset-0 flex"
						style={{ paddingLeft: `${marginPct}%`, paddingRight: `${marginPct}%` }}
					>
						{columnIds.map((id, i) => (
							<div
								key={id}
								className="h-full flex-1 bg-[#ff2d78]/20 outline outline-1 outline-[#ff2d78]/50"
								style={{ marginLeft: i === 0 ? 0 : `${gutterPct}%` }}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

// 프로토타입용 mock 인쇄물(브랜드 무관 포스터).
const poster = `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#e7e2d6"/><rect x="48" y="60" width="300" height="300" rx="8" fill="#1f6f5c"/><circle cx="440" cy="540" r="90" fill="#c7e86b"/><text x="48" y="440" font-family="sans-serif" font-size="66" font-weight="800" fill="#171717">ESSEN</text><text x="48" y="510" font-family="sans-serif" font-size="66" font-weight="800" fill="#171717">HERB</text><text x="48" y="742" font-family="sans-serif" font-size="22" fill="#171717">Seasonal Botanical Report — 2026</text></svg>`,
)}`

export function LayoutGridOverlayDemo() {
	return (
		<LayoutGridOverlay artwork={poster} columns={6} gutterPct={2} marginPct={6} ratio="3 / 4" />
	)
}
