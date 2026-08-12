'use client'

import { useState } from 'react'

// 클리어스페이스 뷰어(클라). 레이아웃 규칙:
//  - 바깥 row = 고정 높이 + 폭 100%. 패널 2개가 그 폭을 flex-1로 균등 양분(박스는 슬라이더에 불변, 창 폭에만 반응).
//  - 🔑 슬라이더 % = 원본(viewBox) 대비 배율. 렌더 높이 = 원본 높이 × %/100, 100% = 원본 1:1.
//    박스 크기를 기준으로 삼으면 패널마다 100%가 다른 배율을 뜻하게 되고, 원본에서 같은 10px였던
//    SVG 내부 치수 텍스트가 패널 간에 다른 크기로 보인다(가로형은 박스 폭에, 세로형은 높이에 걸림).
//    같은 %면 모든 패널이 같은 배율 → 텍스트 크기 일치. 박스보다 커지면 잘린다.
//  - px = 실제 렌더 높이. 파일별 minHeightPx 미만이면 빨강(금지). hover 시 그리드 숨김(CSS).
export type ClearspacePanel = {
	label: string
	logo: string
	grid: string | null
	minHeightPx: number | null
}
type Props = { panels: ClearspacePanel[] }

// 뷰포트 높이(px). 로고 크기와 무관한 고정 표시 영역 — 넘치면 잘린다.
const BASE_H = 640
// 슬라이더 표시값 대비 실제 배율. 슬라이더 눈금은 그대로 10~100%로 두고 실제 배율만 여기서 정한다
// (표시 100% = 원본의 75%). 눈금을 바꾸지 않는 건 사용자에게 보이는 범위를 유지하기 위함.
// 최소크기 경고는 이 값으로 계산된 실제 렌더 높이를 minHeightPx와 비교하므로 배율을 바꿔도 유효하다.
const SCALE_FACTOR = 0.75

export function ClearspaceViewerView({ panels }: Props) {
	const [scale, setScale] = useState(100)
	const [nat, setNat] = useState<(readonly [number, number] | null)[]>([])

	// 원본 높이 × 슬라이더 배율 × SCALE_FACTOR = 실제 렌더 높이(모든 패널 공통 배율).
	const renderedH = (i: number): number | null => {
		const n = nat[i]
		if (!n) return null
		return (n[1] * scale * SCALE_FACTOR) / 100
	}
	const forbidden = (i: number, min: number | null) => {
		const h = renderedH(i)
		return h != null && min != null && h < min
	}
	const anyForbidden = panels.some((p, i) => forbidden(i, p.minHeightPx))

	// SSR로 이미 로드된 SVG는 onLoad가 안 터지므로 콜백 ref에서 complete면 즉시 natural 잡는다.
	const captureNat = (i: number) => (el: HTMLImageElement | null) => {
		if (!el) return
		const grab = () =>
			setNat((prev) => {
				if (prev[i]) return prev
				const next = prev.slice()
				next[i] = [el.naturalWidth, el.naturalHeight] as const
				return next
			})
		if (el.complete && el.naturalWidth) grab()
		else el.addEventListener('load', grab, { once: true })
	}

	return (
		<div className="flex flex-col gap-6">
			{/* 뷰포트 = 박스 하나(고정 높이 · 폭 100%). 넘치면 자른다.
			    그 안에 로고 전체를 한 그룹으로 묶어 가운데 정렬한다(패널별로 폭을 나눠 갖지 않는다). */}
			<div
				className="flex w-full items-center justify-center overflow-hidden"
				style={{ height: BASE_H }}
			>
				<div className="flex shrink-0 items-center gap-6">
					{panels.map((p, i) => {
						const h = renderedH(i)
						return (
							// shrink-0 + max-w-none = 박스보다 커져도 폭이 clamp되지 않게(Tailwind preflight의
							// img{max-width:100%}가 걸리면 SVG가 폭 기준으로 축소돼 높이만 자란다).
							<div key={p.label} className="group relative shrink-0">
								{/* biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용. */}
								<img
									ref={captureNat(i)}
									src={p.logo}
									alt={p.label}
									style={{ height: h ?? undefined }}
									className="block w-auto max-w-none"
								/>
								{p.grid ? (
									// biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용.
									<img
										src={p.grid}
										alt=""
										style={{ height: h ?? undefined }}
										className="absolute top-0 left-0 w-auto max-w-none transition-opacity duration-200 group-hover:opacity-0"
									/>
								) : null}
							</div>
						)
					})}
				</div>
			</div>

			{/* 캡션은 박스 밖 — 로고가 뷰포트를 넘겨도 px·금지 표시가 잘리지 않게. */}
			<div className="flex justify-center gap-12">
				{panels.map((p, i) => {
					const h = renderedH(i)
					const bad = forbidden(i, p.minHeightPx)
					return (
						<span
							key={p.label}
							className={`text-xs ${bad ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}
						>
							{p.label} · {h != null ? `${Math.round(h)}px` : '…'}
							{bad ? ' · 최소크기 미만(금지)' : ''}
						</span>
					)
				})}
			</div>

			{/* 공유 스케일 슬라이더 — 100%(원본 1:1)에서 시작해 10%까지 축소. */}
			<div className="mx-auto flex w-full max-w-xs items-center gap-3">
				<input
					type="range"
					min={10}
					max={100}
					value={scale}
					onChange={(e) => setScale(Number(e.target.value))}
					className={`w-full ${anyForbidden ? 'accent-destructive' : 'accent-foreground'}`}
					aria-label="로고 표시 배율"
				/>
				<span
					className={`w-12 text-right text-xs ${anyForbidden ? 'text-destructive' : 'text-muted-foreground'}`}
				>
					{scale}%
				</span>
			</div>
		</div>
	)
}

export default ClearspaceViewerView
