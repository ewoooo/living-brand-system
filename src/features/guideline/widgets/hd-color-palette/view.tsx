'use client'

import { useState } from 'react'
import { copyText } from '@/features/guideline/blocks/color-palette/copy'
import { getContrastingForeground, hexToRgb, isValidHex } from '@/lib/color'

export type PaletteSwatch = {
	id: string
	name: string
	hex: string
	cmyk?: string | null
	pantone?: string | null
}

export type PaletteLayout = 'uniform' | 'ranked'

/**
 * 위계 판형의 높이 단위(rem). 순위 가중치 × 이 값이 행 높이다.
 * 3그룹이면 3:2:1 → 16.5 / 11 / 5.5rem. 가운데(가중치 2)가 개편 전 높이(h-44 = 11rem)와 같다.
 */
const RANK_UNIT_REM = 5.5

// 클릭하면 HEX를 복사하는 스와치. essenherb ColorSwatch와 같은 동작이지만 그 파일을 건드리지 않는다 —
// 공유 컴포넌트를 고치면 레거시 페이지까지 같이 변형되기 때문이다(brand-colors에서 한 번 밟았다).
export function HdColorPaletteView({
	swatches,
	layout,
	/** 균일 판형에서 모든 칸을 같은 크기로 만들기 위한 열 수. 위젯 안 최다 색 수다. */
	columnCount,
	/** 위계 판형의 순위 가중치(앞 그룹일수록 크다). 균일 판형에서는 무시된다. */
	rankWeight,
}: {
	swatches: PaletteSwatch[]
	layout: PaletteLayout
	columnCount: number
	rankWeight: number
}) {
	// 🔴 `1fr`은 `minmax(auto, 1fr)`이라 내용이 넓으면 안 줄어든다. `minmax(0, 1fr)`로 써야 균등해진다.
	//
	// 균일: 열 수를 위젯 전체의 최다 색 수로 고정한다. 그래야 색이 3개인 계열과 6개인 계열의 칸이
	//       같은 크기가 된다 — 색 수로 나누면 적은 계열일수록 칸이 커져 중요도가 있는 것처럼 읽힌다.
	//       모자란 칸은 채우지 않고 오른쪽을 비운다.
	// 위계: 행이 폭을 100% 채우고, 높이가 순위를 말한다.
	const columns = layout === 'uniform' ? columnCount : swatches.length

	return (
		<div
			className="grid w-full"
			style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
		>
			{swatches.map((swatch) => (
				<Swatch
					key={swatch.id}
					swatch={swatch}
					square={layout === 'uniform'}
					heightRem={layout === 'ranked' ? rankWeight * RANK_UNIT_REM : undefined}
				/>
			))}
		</div>
	)
}

function Swatch({
	swatch,
	square,
	heightRem,
}: {
	swatch: PaletteSwatch
	square: boolean
	heightRem?: number
}) {
	const [copied, setCopied] = useState(false)
	// hex가 깨진 데이터면 파생 계산이 던지므로 색면을 포기하고 텍스트만 남긴다.
	const valid = isValidHex(swatch.hex)
	const rgb = valid ? hexToRgb(swatch.hex) : null
	const surface = valid
		? { backgroundColor: swatch.hex, color: getContrastingForeground(swatch.hex) }
		: undefined

	async function copy() {
		// 성공했을 때만 "복사됨" 표시 — 거짓 피드백 방지(프리뷰 iframe은 clipboard 권한이 없다).
		if (await copyText(swatch.hex)) {
			setCopied(true)
			setTimeout(() => setCopied(false), 1200)
		}
	}

	return (
		<button
			type="button"
			onClick={copy}
			title={`${swatch.hex} 복사`}
			className={`group relative flex cursor-pointer flex-col justify-between p-3 text-left font-body text-xs outline-none ring-foreground/60 transition-transform hover:z-20 hover:scale-105 focus-visible:z-20 focus-visible:ring-2 ${
				square ? 'aspect-square' : ''
			}`}
			style={{ ...surface, height: heightRem ? `${heightRem}rem` : undefined }}
		>
			<span className="font-medium">{copied ? '✓ 복사됨' : swatch.name}</span>

			{/* 상시 노출은 디지털 작업에 바로 쓰는 두 값만. 나머지는 hover에서 편다. */}
			<dl className="grid grid-cols-[2.75rem_1fr] tabular-nums">
				<Spec label="HEX" value={swatch.hex} />
				<Spec label="RGB" value={rgb && `${rgb.r} ${rgb.g} ${rgb.b}`} />
			</dl>

			{/*
				인쇄값은 칸 아래로 이어 붙여 편다. 칸 안에 넣지 않는 이유: 위계 판형의 가장 낮은 행
				(5.5rem)은 네 줄이 물리적으로 안 들어간다. 같은 배경색을 깔아 칸이 늘어난 것처럼 읽히게 한다.
				값이 없는 줄도 라벨을 남긴다 — 브랜드팀에서 아직 안 온 항목이 화면에서 보이게.
			*/}
			<dl
				aria-hidden
				className="absolute inset-x-0 top-full hidden grid-cols-[2.75rem_1fr] px-3 pb-3 tabular-nums group-focus-visible:grid group-hover:grid"
				style={surface}
			>
				<Spec label="CMYK" value={swatch.cmyk} />
				<Spec label="PMS" value={swatch.pantone} />
			</dl>
		</button>
	)
}

function Spec({ label, value }: { label: string; value?: string | null }) {
	return (
		<>
			<dt className="opacity-70">{label}</dt>
			<dd>{value ?? ''}</dd>
		</>
	)
}
