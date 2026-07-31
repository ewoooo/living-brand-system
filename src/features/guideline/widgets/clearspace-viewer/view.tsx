'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// 클리어스페이스 뷰어(클라). 레이아웃 규칙:
//  - 바깥 row = 고정 높이 + 폭 100%. 패널 2개가 그 폭을 flex-1로 균등 양분(각 박스는 슬라이더에 불변, 창 폭에만 반응).
//  - 로고는 자기 박스(50%폭 × 고정높이)에 fit된 크기가 기준(=슬라이더 100%, 창폭 보정된 값), 슬라이더로 그 높이를 배율.
//  - px = 실제 렌더 높이. 파일별 minHeightPx 미만이면 빨강(금지). hover 시 그리드 숨김(CSS).
export type ClearspacePanel = {
	label: string
	logo: string
	grid: string | null
	minHeightPx: number | null
}
type Props = { panels: ClearspacePanel[] }

// 고정 기준높이(px). 박스 높이 = 이 값. 로고는 이 높이와 박스폭 중 작은 쪽에 맞춰 fit.
const BASE_H = 480

export function ClearspaceViewerView({ panels }: Props) {
	const [scale, setScale] = useState(100)
	const [boxW, setBoxW] = useState<number[]>([])
	const [nat, setNat] = useState<(readonly [number, number] | null)[]>([])
	const boxes = useRef<(HTMLDivElement | null)[]>([])

	// 박스 실폭 측정(창 리사이즈에 반응). 슬라이더 변경엔 재측정 불필요(박스 불변).
	const measure = useCallback(() => {
		setBoxW(boxes.current.map((b) => b?.clientWidth ?? 0))
	}, [])
	useEffect(() => {
		measure()
		window.addEventListener('resize', measure)
		return () => window.removeEventListener('resize', measure)
	}, [measure])

	// 박스에 fit된 로고 높이(창폭 보정 기준) × 슬라이더 배율 = 실제 렌더 높이.
	const renderedH = (i: number): number | null => {
		const n = nat[i]
		const w = boxW[i]
		if (!n || !w) return null
		const [nw, nh] = n
		const fit = Math.min(BASE_H, (w * nh) / nw) // 높이·폭 중 작은 쪽에 맞춤
		return (fit * scale) / 100
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
			{/* row: 고정 높이 + 폭 100%. 패널이 flex-1로 폭 균등 양분. */}
			<div
				className="flex items-end justify-center gap-12 overflow-x-auto"
				style={{ height: BASE_H }}
			>
				{panels.map((p, i) => {
					const h = renderedH(i)
					const bad = forbidden(i, p.minHeightPx)
					return (
						<div
							key={p.label}
							className="flex min-w-0 flex-1 flex-col items-center gap-2"
						>
							{/* 박스: 50%폭 × 고정높이. 슬라이더 불변. 로고는 이 안에서 가운데 스케일. */}
							<div
								ref={(el) => {
									boxes.current[i] = el
								}}
								className="flex w-full items-center justify-center"
								style={{ height: BASE_H }}
							>
								<div className="group relative inline-block">
									{/* biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용. */}
									<img
										ref={captureNat(i)}
										src={p.logo}
										alt={p.label}
										style={{ height: h ?? undefined }}
										className="block w-auto"
									/>
									{p.grid ? (
										// biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용.
										<img
											src={p.grid}
											alt=""
											style={{ height: h ?? undefined }}
											className="absolute top-0 left-0 w-auto transition-opacity duration-200 group-hover:opacity-0"
										/>
									) : null}
								</div>
							</div>
							<span
								className={`text-xs ${bad ? 'font-semibold text-red-600' : 'text-neutral-500'}`}
							>
								{p.label} · {h != null ? `${Math.round(h)}px` : '…'}
								{bad ? ' · 최소크기 미만(금지)' : ''}
							</span>
						</div>
					)
				})}
			</div>

			{/* 공유 스케일 슬라이더 — 100%에서 시작(박스 fit 기준). */}
			<div className="mx-auto flex w-full max-w-xs items-center gap-3">
				<input
					type="range"
					min={20}
					max={200}
					value={scale}
					onChange={(e) => setScale(Number(e.target.value))}
					className={`w-full ${anyForbidden ? 'accent-red-600' : 'accent-neutral-800'}`}
					aria-label="로고 표시 배율"
				/>
				<span
					className={`w-12 text-right text-xs ${anyForbidden ? 'text-red-600' : 'text-neutral-500'}`}
				>
					{scale}%
				</span>
			</div>
		</div>
	)
}

export default ClearspaceViewerView
