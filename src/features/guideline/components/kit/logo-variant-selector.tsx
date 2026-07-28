'use client'

import { useState } from 'react'
import { isLightColor, isValidHex } from '@/lib/color'

/**
 * 로고 배리언트 셀렉터 — cash.app/logo의 Logo Variant Selector 구조 차용.
 * 배경색을 자유롭게 바꾸면(color picker + HEX) 배경 명도에 맞는 로고 variant가 자동 선택된다.
 * (프로토타입이라 실제 variant SVG 대신 색상 치환으로 로고를 바꾼다.)
 * 브랜드 무관: 로고·variant 목록 전부 props.
 *
 * @example
 * <LogoVariantSelector logo={(color) => dataUri} variants={[{ id, label, color, file }]} />
 */
export type LogoVariant = { id: string; label: string; color: string; file: string }

export function LogoVariantSelector({
	logo,
	variants,
}: {
	/** 로고 색을 받아 SVG data-URI를 돌려주는 함수(색상 치환). */
	logo: (color: string) => string
	/** 밝은 배경용이 첫 항목, 어두운 배경용이 둘째 항목이라고 가정한다. */
	variants: LogoVariant[]
}) {
	const [bg, setBg] = useState('#F1F4F5')
	const [hexInput, setHexInput] = useState('#F1F4F5')

	// 배경 명도로 variant 자동 선택: 밝으면 첫째(원색), 어두우면 둘째(반전).
	const active = isLightColor(bg) ? variants[0] : (variants[1] ?? variants[0])

	function applyColor(next: string) {
		setBg(next)
		setHexInput(next)
	}
	function onHexChange(value: string) {
		setHexInput(value)
		if (isValidHex(value)) setBg(value)
	}

	return (
		<div className="relative w-full overflow-hidden border border-border">
			{/* 프리뷰 스테이지 */}
			<div className="grid min-h-80 place-items-center p-10" style={{ backgroundColor: bg }}>
				{/* biome-ignore lint/performance/noImgElement: 색상 치환 data-URI라 next/image 미사용. */}
				<img src={logo(active.color)} alt={active.label} className="h-16 w-auto md:h-20" />
			</div>

			{/* 컨트롤 카드(우상단) */}
			<div className="absolute top-4 right-4 flex w-60 flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-lg">
				<div className="flex items-center gap-2">
					<input
						type="color"
						aria-label="배경색 선택"
						value={bg}
						onChange={(event) => applyColor(event.target.value)}
						className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
					/>
					<input
						type="text"
						aria-label="배경색 HEX"
						value={hexInput}
						onChange={(event) => onHexChange(event.target.value)}
						spellCheck={false}
						className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-foreground text-sm uppercase"
					/>
				</div>

				{/* variant 칩 row — 자동 선택된 것 강조 */}
				<div className="flex gap-1.5">
					{variants.map((variant) => (
						<span
							key={variant.id}
							title={variant.label}
							className={`h-7 flex-1 rounded border transition-all ${
								variant.id === active.id
									? 'border-foreground ring-2 ring-foreground ring-offset-1 ring-offset-background'
									: 'border-border'
							}`}
							style={{ backgroundColor: variant.color }}
						/>
					))}
				</div>

				<p className="truncate font-mono text-xs text-muted-foreground" title={active.file}>
					{active.file}
				</p>
			</div>
		</div>
	)
}

// 프로토타입용 mock 로고/variant(브랜드 무관). 심볼 + 워드마크 락업을 색상 치환.
const lockup = (color: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="64" viewBox="0 0 300 64"><rect x="0" y="8" width="48" height="48" rx="12" fill="${color}"/><path d="M14 34 l7 7 l13 -17" fill="none" stroke="${color === '#FFFFFF' ? '#171717' : '#FFFFFF'}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="64" y="42" font-family="sans-serif" font-size="30" font-weight="800" letter-spacing="-1" fill="${color}">Essenherb</text></svg>`,
	)}`

const variants: LogoVariant[] = [
	{ id: 'green', label: 'Primary · Green', color: '#1F6F5C', file: 'Logo_Primary_Green.svg' },
	{ id: 'white', label: 'Reversed · White', color: '#FFFFFF', file: 'Logo_Reversed_White.svg' },
	{ id: 'ink', label: 'Mono · Ink', color: '#171717', file: 'Logo_Mono_Ink.svg' },
]

export function LogoVariantSelectorDemo() {
	return <LogoVariantSelector logo={lockup} variants={variants} />
}
