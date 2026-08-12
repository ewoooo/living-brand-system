'use client'

import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BRAND_PANEL_DARK, BRAND_PANEL_LIGHT } from '../surface'

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
			{/* 방향 하나를 고르는 설정 전환이다 — 표본 면이 아니라 위젯 UI이므로 앱 프리미티브를 쓴다. */}
			<ToggleGroup
				type="single"
				variant="outline"
				value={orient}
				// 마지막 항목을 다시 눌러 빈 값이 되면 그릴 표본이 없어진다 — 빈 값은 무시한다.
				onValueChange={(next) => next && setOrient(next)}
				aria-label="로고 방향"
			>
				{orientations.map((o) => (
					<ToggleGroupItem key={o} value={o} className="px-3">
						{ORIENT_LABEL[o] ?? o}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			{/* 2×2: 기본형(좌 2행) · WHITE(우상) · 단색(우하).
			    컨테이너 height 고정 + width 반응형 + gap → 셀 박스 결정.
			    로고 박스는 셀의 40%(=1/2.5)이고 그 안에서 object-contain — 폭도 높이도 셀의 1/2.5를 넘지 않는다.
			    (높이 %만 지정하면 종횡비에 따라 폭이 셀을 넘겨 여백이 사라진다.) */}
			<div className="grid h-[600px] w-full grid-cols-2 grid-rows-2 gap-3">
				{colors.default ? (
					<div
						className={`row-span-2 flex items-center justify-center ${BRAND_PANEL_LIGHT}`}
					>
						<div className="h-[40%] w-[40%]">
							{/* biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용. */}
							<img
								src={colors.default}
								alt="기본형"
								className="h-full w-full object-contain"
							/>
						</div>
					</div>
				) : null}
				{colors.white ? (
					// 🔴 이 판은 다크 모드에서도 어둡게 고정된다 — WHITE 워드마크는 어두운 판에서만 성립한다.
					<div className={`flex items-center justify-center ${BRAND_PANEL_DARK}`}>
						<div className="h-[40%] w-[40%]">
							{/* biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용. */}
							<img
								src={colors.white}
								alt="WHITE"
								className="h-full w-full object-contain"
							/>
						</div>
					</div>
				) : null}
				{colors.mono ? (
					<div className={`flex items-center justify-center ${BRAND_PANEL_LIGHT}`}>
						<div className="h-[40%] w-[40%]">
							{/* biome-ignore lint/performance/noImgElement: Payload upload URL이라 next/image 미사용. */}
							<img
								src={colors.mono}
								alt="단색"
								className="h-full w-full object-contain"
							/>
						</div>
					</div>
				) : null}
			</div>
		</div>
	)
}

export default LogoColorVariantView
