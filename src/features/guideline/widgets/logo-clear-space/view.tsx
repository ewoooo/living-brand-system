'use client'

import { useState } from 'react'

// 로고 클리어스페이스 뷰(클라) — 로고 위에 H-비율 클리어스페이스 박스 + 최소크기 스펙을 오버레이한다.
// 🔑 H-비율은 orientation(가로/세로)만으로 완전 결정되는 상수(01-specs B). 로고별 데이터 아님.
// ponytail: 클리어스페이스 박스는 "심볼 높이 H의 1/2 모듈"의 시각 근사 — 로고 SVG 내 심볼 위치/높이를
// 픽셀 측정하지 않는다(디자이너 몫). 비율 라벨/스펙은 정확, 점선 박스는 개념 전달용.
const RATIOS = {
	horizontal: {
		wordmarkH: '0.65H',
		clearSpace: '0.5H',
		gap: '0.25H',
		exceptionClearSpace: '0.25H',
	},
	vertical: { wordmarkH: '0.3H', clearSpace: '0.4H', gap: '0.2H', exceptionClearSpace: '0.2H' },
} as const
const MIN_SIZE = { digital: '16px', print: '4mm' } as const

type Props = { src: string; alt: string; orientation: 'horizontal' | 'vertical' }

export function LogoClearSpaceView({ src, alt, orientation }: Props) {
	const [showGrid, setShowGrid] = useState(true)
	const spec = RATIOS[orientation]
	const margin = Number.parseFloat(spec.clearSpace) || 0.5
	const padPct = Math.min(28, margin * 30) // 시각 여백(%) 근사

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-end">
				<button
					type="button"
					onClick={() => setShowGrid((v) => !v)}
					className="rounded border px-2 py-0.5 text-neutral-500 text-xs hover:bg-neutral-50"
				>
					{showGrid ? '가이드 끄기' : '가이드 켜기'}
				</button>
			</div>

			{/* 클리어스페이스 시각화 */}
			<div
				className="relative flex items-center justify-center overflow-hidden rounded"
				style={{
					aspectRatio: orientation === 'horizontal' ? '16 / 7' : '3 / 4',
					background: showGrid ? 'rgba(0,174,66,0.06)' : '#fafafa',
					padding: `${padPct}%`,
				}}
			>
				{showGrid ? (
					<div
						className="pointer-events-none absolute rounded-sm border border-[#00ae42] border-dashed"
						style={{ inset: `${padPct}%`, borderColor: 'rgba(0,174,66,0.5)' }}
					/>
				) : null}
				{showGrid ? (
					<span
						className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 text-[#006432] text-[10px]"
						style={{ opacity: 0.8 }}
					>
						{spec.clearSpace}
					</span>
				) : null}
				{/* biome-ignore lint/performance/noImgElement: Payload upload URL(로컬·S3)이라 next/image 미사용. */}
				<img src={src} alt={alt} className="relative max-h-full max-w-full" />
			</div>

			{/* 스펙 테이블 */}
			<dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
				<div className="flex justify-between">
					<dt className="text-neutral-500">심볼 높이</dt>
					<dd className="font-medium">H</dd>
				</div>
				<div className="flex justify-between">
					<dt className="text-neutral-500">워드마크</dt>
					<dd className="font-medium">{spec.wordmarkH}</dd>
				</div>
				<div className="flex justify-between">
					<dt className="text-neutral-500">최소 여백</dt>
					<dd className="font-medium">{spec.clearSpace}</dd>
				</div>
				<div className="flex justify-between">
					<dt className="text-neutral-500">심볼-워드마크</dt>
					<dd className="font-medium">{spec.gap}</dd>
				</div>
				<div className="flex justify-between">
					<dt className="text-neutral-500">예외 여백</dt>
					<dd className="font-medium">{spec.exceptionClearSpace}</dd>
				</div>
				<div className="flex justify-between">
					<dt className="text-neutral-500">최소 크기</dt>
					<dd className="font-medium">
						{MIN_SIZE.digital} / {MIN_SIZE.print}
					</dd>
				</div>
			</dl>
		</div>
	)
}

export default LogoClearSpaceView
