'use client'

import { useState } from 'react'

// 로고 색상 변형 뷰(클라) — 가로/세로 토글 + 색상 3종(기본/WHITE/단색) 실파일 동시 표시.
// 레이아웃: 기본형(좌, 2행 span) · WHITE(우상, 어두운 배경) · 단색(우하). 🔴 CSS 색 조정 없음, 실파일 그대로.
type ColorMap = Record<string, string> // { default, white, mono } → url
type Props = { map: Record<string, ColorMap> } // { horizontal, vertical } → ColorMap

const ORIENT_LABEL: Record<string, string> = { horizontal: '가로형', vertical: '세로형' }

export function LogoColorVariantView({ map }: Props) {
	const orientations = Object.keys(map).sort((a) => (a === 'horizontal' ? -1 : 1)) // 가로 우선
	const [orient, setOrient] = useState(orientations[0])
	const colors = map[orient] ?? {}

	return (
		<div className="flex flex-col gap-4">
			{/* 가로/세로 토글 */}
			<div className="flex gap-2">
				{orientations.map((o) => (
					<button
						type="button"
						key={o}
						onClick={() => setOrient(o)}
						className={`rounded border px-3 py-1 text-sm ${
							o === orient ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600'
						}`}
					>
						{ORIENT_LABEL[o] ?? o}
					</button>
				))}
			</div>
			{/* 2×2: 기본형(좌 2행) · WHITE(우상) · 단색(우하).
			    컨테이너 height 고정 + width 반응형 + gap → 셀 박스 결정. 로고는 셀 height의 30%. */}
			<div className="grid h-[400px] w-full grid-cols-2 grid-rows-2 gap-3">
				{colors.default ? (
					<div className="row-span-2 flex items-center justify-center bg-neutral-100">
						{/* biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용. */}
						<img src={colors.default} alt="기본형" className="h-[30%] w-auto max-w-full object-contain" />
					</div>
				) : null}
				{colors.white ? (
					<div className="flex items-center justify-center bg-neutral-900">
						{/* biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용. */}
						<img src={colors.white} alt="WHITE" className="h-[30%] w-auto max-w-full object-contain" />
					</div>
				) : null}
				{colors.mono ? (
					<div className="flex items-center justify-center bg-neutral-100">
						{/* biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용. */}
						<img src={colors.mono} alt="단색" className="h-[30%] w-auto max-w-full object-contain" />
					</div>
				) : null}
			</div>
		</div>
	)
}

export default LogoColorVariantView
