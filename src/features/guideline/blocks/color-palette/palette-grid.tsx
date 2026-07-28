'use client'

import { useState } from 'react'
import { getContrastingForeground, hexToRgb } from '@/lib/color'
import { copyText } from './copy'

// 스와치 한 칸. name은 BrandColor.name(로컬라이즈됨), units는 높이 배수(main 열 전용).
export type PaletteChip = {
	id: number
	name: string
	hex: string
	pantone?: string | null
}
export type PaletteMainChip = PaletteChip & { units: number }

/**
 * essenherb 원본 스타일의 flush 컬러 팔레트 — 왼쪽 main 열(폭 2u) + 오른쪽 계열 그리드.
 * border/radius/gap 없이 색 블록이 서로 붙는다. 클릭하면 HEX를 클립보드에 복사.
 *
 * 단위 unit = 컨테이너 폭 / (mainWidth + cols)(cqw). 셀은 1u 정사각(폭 1u = 높이 1u),
 * main 열 칩만 units 배수로 높이가 커진다. main 총 높이 = 그리드 행 수(정렬 불변식).
 * 브랜드 무관: 모든 색·구조는 props(서버에서 BrandColor 필드로 그룹핑).
 */
export function PaletteGrid({
	main,
	families,
}: {
	/** isMain 색. hero(tone 있는 색)가 먼저 오고 units로 남은 높이를 채운다. */
	main: PaletteMainChip[]
	/** tone 있는 색을 계열별로 묶은 행. 각 행은 tone 오름차순. */
	families: PaletteChip[][]
}) {
	const [copiedId, setCopiedId] = useState<number | null>(null)

	const copy = async (id: number, hex: string) => {
		if (await copyText(hex)) {
			setCopiedId(id)
			setTimeout(() => setCopiedId(null), 1200)
		}
	}

	const cols = Math.max(1, ...families.map((row) => row.length))
	const mainWidth = main.length > 0 ? 2 : 0
	// unit = 컨테이너 폭의 1/(mainWidth+cols). 모든 칩 높이의 기본 단위.
	const unit = (n: number) => `calc(100cqw / ${mainWidth + cols} * ${n})`

	const chip = (c: PaletteChip, height: string) => {
		const copied = copiedId === c.id
		const { r, g, b } = hexToRgb(c.hex)
		return (
			<button
				key={c.id}
				type="button"
				onClick={() => copy(c.id, c.hex)}
				title={`${c.hex} 복사`}
				className="group relative flex w-full cursor-pointer flex-col items-start gap-0.5 p-3 text-left font-body outline-none ring-foreground/60 transition-transform duration-150 hover:z-10 hover:scale-105 focus-visible:ring-2"
				style={{ height, backgroundColor: c.hex, color: getContrastingForeground(c.hex) }}
			>
				<span className="font-semibold text-xs">{c.name}</span>
				<span className="text-xs tabular-nums opacity-80">
					RGB {r} {g} {b}
				</span>
				<span className="text-xs tabular-nums opacity-80">
					{copied ? '✓ 복사됨' : `HEX ${c.hex}`}
				</span>
				{c.pantone && <span className="text-xs opacity-80">Pantone {c.pantone}</span>}
				{/* hover 시 우하단 복사 아이콘 — 클릭하면 복사된다는 신호 */}
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					className="absolute right-2 bottom-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
				>
					<title>복사</title>
					<rect x="9" y="9" width="11" height="11" rx="1" />
					<path d="M5 15V4a1 1 0 0 1 1-1h9" />
				</svg>
			</button>
		)
	}

	return (
		// containerType로 cqw(=컨테이너 폭 1%)를 켠다.
		<div className="flex w-full" style={{ containerType: 'inline-size' }}>
			{main.length > 0 && (
				<div className="flex flex-col" style={{ flexGrow: mainWidth, flexBasis: 0 }}>
					{main.map((c) => chip(c, unit(c.units)))}
				</div>
			)}
			<div
				className="grid"
				style={{
					flexGrow: cols,
					flexBasis: 0,
					gridTemplateColumns: `repeat(${cols}, 1fr)`,
				}}
			>
				{families.flat().map((c) => chip(c, unit(1)))}
			</div>
		</div>
	)
}
