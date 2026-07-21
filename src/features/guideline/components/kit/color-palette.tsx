'use client'

import { useState } from 'react'
import { getContrastingForeground, hexToRgb } from '@/lib/color'

/**
 * 컬러 팔레트(kit 프로토타입) — main 열 + multi 그리드를 수평 배치한 flush 팔레트.
 * - flush: border-radius·border·chip 간 gap 전부 없음(색 블록이 서로 붙는다).
 * - 단위 unit = 컨테이너 폭/7(cqw). 폭은 flex 2:5(main 2u / multi 5u), 높이는 unit 배수로 하드코딩.
 * - main 열(폭 2u): 에센허브 레드(4u) / White(1u) / Black(1u).
 * - multi(폭 5u): 5열×6행 계열별 그리드(퍼플 5단계 포함), 각 셀 1u 정사각.
 * - 칩 안에 이름·RGB·HEX·Pantone. 클릭하면 HEX 복사. hover 시 우하단 복사 아이콘 + 칩 살짝 확대.
 * 브랜드 무관: 색은 props. 기본값은 essenherb. RGB는 HEX에서 파생.
 */
type Swatch = { id: string; name: string; hex: string; pantone?: string }

// main 열: 에센허브 레드(fill) + white + black. multi의 red-3와 별개 칩(id 구분).
const MAIN: Swatch[] = [
	{ id: 'main-red', name: 'Essenherb Red', hex: '#EA5343', pantone: 'Warm Red C' },
	{ id: 'main-white', name: 'White', hex: '#FFFFFF' },
	{ id: 'main-black', name: 'Black', hex: '#000000' },
]

// 계열별 행. essenherb 원본 팔레트 값(HEX·Pantone). 그레이는 Pantone 없음.
const MULTI: Swatch[][] = [
	[
		{ id: 'red-1', name: 'Red 1', hex: '#FFF0EB', pantone: '705C' },
		{ id: 'red-2', name: 'Red 2', hex: '#FFB4AA', pantone: '169C' },
		{ id: 'red-3', name: 'Essenherb Red', hex: '#EA5343', pantone: 'Warm Red C' },
		{ id: 'red-4', name: 'Red 4', hex: '#871400', pantone: '7620C' },
		{ id: 'red-5', name: 'Red 5', hex: '#460500', pantone: '188C' },
	],
	[
		{ id: 'yellow-1', name: 'Yellow 1', hex: '#FFFAC2', pantone: '600C' },
		{ id: 'yellow-2', name: 'Yellow 2', hex: '#FFF095', pantone: '602C' },
		{ id: 'yellow-3', name: 'Yellow 3', hex: '#FFE65F', pantone: '7404C' },
		{ id: 'yellow-4', name: 'Yellow 4', hex: '#A07D0F', pantone: '118C' },
		{ id: 'yellow-5', name: 'Yellow 5', hex: '#503200', pantone: '7575C' },
	],
	[
		{ id: 'green-1', name: 'Green 1', hex: '#E6FFE6', pantone: '2253C' },
		{ id: 'green-2', name: 'Green 2', hex: '#A7F5AE', pantone: '2255C' },
		{ id: 'green-3', name: 'Green 3', hex: '#50AE5F', pantone: '2257C' },
		{ id: 'green-4', name: 'Green 4', hex: '#195F30', pantone: '555C' },
		{ id: 'green-5', name: 'Green 5', hex: '#002B1E', pantone: '567C' },
	],
	[
		{ id: 'blue-1', name: 'Blue 1', hex: '#E1F0FF', pantone: '657C' },
		{ id: 'blue-2', name: 'Blue 2', hex: '#A5CDFF', pantone: '2717C' },
		{ id: 'blue-3', name: 'Blue 3', hex: '#3C87CD', pantone: '279C' },
		{ id: 'blue-4', name: 'Blue 4', hex: '#1E508C', pantone: '2161C' },
		{ id: 'blue-5', name: 'Blue 5', hex: '#001941', pantone: '2768C' },
	],
	[
		{ id: 'purple-1', name: 'Purple 1', hex: '#FAEBFF', pantone: '531C' },
		{ id: 'purple-2', name: 'Purple 2', hex: '#EBC8E9', pantone: '529C' },
		{ id: 'purple-3', name: 'Purple 3', hex: '#A546BE', pantone: '258C' },
		{ id: 'purple-4', name: 'Purple 4', hex: '#692373', pantone: '260C' },
		{ id: 'purple-5', name: 'Purple 5', hex: '#3C0046', pantone: '7449C' },
	],
	[
		{ id: 'gray-1', name: 'Gray 1', hex: '#FAFAFA' },
		{ id: 'gray-2', name: 'Gray 2', hex: '#EBEBEB' },
		{ id: 'gray-3', name: 'Gray 3', hex: '#ACACAC' },
		{ id: 'gray-4', name: 'Gray 4', hex: '#464646' },
		{ id: 'gray-5', name: 'Gray 5', hex: '#151515' },
	],
]

// 팔레트 기본 단위 = 컨테이너 폭의 1/7(cqw). 모든 칩 높이를 이 단위 배수로 하드코딩한다.
const unit = (n: number) => `calc(100cqw / 7 * ${n})`

// Clipboard API → 레거시 execCommand 폴백. 하나라도 성공하면 true.
async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		// 폴백으로 진행
	}
	try {
		const ta = document.createElement('textarea')
		ta.value = text
		ta.style.position = 'fixed'
		ta.style.opacity = '0'
		document.body.appendChild(ta)
		ta.select()
		const ok = document.execCommand('copy')
		document.body.removeChild(ta)
		return ok
	} catch {
		return false
	}
}

export function ColorPalette({
	main = MAIN,
	multi = MULTI,
}: {
	main?: Swatch[]
	multi?: Swatch[][]
}) {
	const [copiedId, setCopiedId] = useState<string | null>(null)

	const copy = async (id: string, hex: string) => {
		if (await copyText(hex)) {
			setCopiedId(id)
			setTimeout(() => setCopiedId(null), 1200)
		}
	}

	// 높이는 단위(unit)로 명시 지정. 폭은 부모가 정함(main 열 2u / multi 셀 1u).
	const Chip = (swatch: Swatch, height: string) => {
		const copied = copiedId === swatch.id
		const { r, g, b } = hexToRgb(swatch.hex)
		return (
			<button
				key={swatch.id}
				type="button"
				onClick={() => copy(swatch.id, swatch.hex)}
				title={`${swatch.hex} 복사`}
				className="group relative flex w-full cursor-pointer flex-col items-start gap-0.5 p-3 text-left font-body outline-none ring-foreground/60 transition-transform duration-150 hover:z-10 hover:scale-105 focus-visible:ring-2"
				style={{
					height,
					backgroundColor: swatch.hex,
					color: getContrastingForeground(swatch.hex),
				}}
			>
				<span className="font-semibold text-xs">{swatch.name}</span>
				<span className="text-xs tabular-nums opacity-80">
					RGB {r} {g} {b}
				</span>
				<span className="text-xs tabular-nums opacity-80">
					{copied ? '✓ 복사됨' : `HEX ${swatch.hex}`}
				</span>
				{swatch.pantone && (
					<span className="text-xs opacity-80">Pantone {swatch.pantone}</span>
				)}
				{/* hover 시 우하단에 복사 아이콘 — 클릭하면 복사된다는 신호 */}
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
		// containerType로 cqw(=컨테이너 폭 1%)를 켠다. unit = 폭/7이 모든 칩의 기본 단위.
		<div className="flex w-full" style={{ containerType: 'inline-size' }}>
			{/* main 열 — 폭 2u(flex-[2]). red 4u(fill) / white 1u / black 1u */}
			<div className="flex flex-[2] flex-col">
				{Chip(main[0], unit(4))}
				{Chip(main[1], unit(1))}
				{Chip(main[2], unit(1))}
			</div>
			{/* multi — 폭 5u(flex-[5]), 5열. 각 칸 1u 정사각(폭 1u = 높이 1u). */}
			<div className="grid flex-[5] grid-cols-5">
				{multi.flat().map((s) => Chip(s, unit(1)))}
			</div>
		</div>
	)
}

export function ColorPaletteDemo() {
	return <ColorPalette />
}
