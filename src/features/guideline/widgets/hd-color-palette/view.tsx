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

// 클릭하면 HEX를 복사하는 스와치. essenherb ColorSwatch와 같은 동작이지만 그 파일을 건드리지 않는다 —
// 공유 컴포넌트를 고치면 레거시 페이지까지 같이 변형되기 때문이다(brand-colors에서 한 번 밟았다).
// 여기서만 다른 것: hover 확대, 그리고 값 없는 줄도 라벨을 남겨 미수령 항목이 화면에 보이게 하는 것.
export function HdColorPaletteView({ swatches }: { swatches: PaletteSwatch[] }) {
	// 한 행이 폭을 100% 채운다 — 색 수로 균등 분할한다.
	// 🔴 `1fr`은 `minmax(auto, 1fr)`이라 내용이 넓으면 안 줄어든다. `minmax(0, 1fr)`로 써야 균등해진다.
	// 높이는 고정 — aspect-square면 색 수가 다른 행끼리 높이가 갈려 한 덩어리로 안 읽힌다.
	return (
		<div
			className="grid w-full"
			style={{ gridTemplateColumns: `repeat(${swatches.length}, minmax(0, 1fr))` }}
		>
			{swatches.map((swatch) => (
				<Swatch key={swatch.id} swatch={swatch} />
			))}
		</div>
	)
}

function Swatch({ swatch }: { swatch: PaletteSwatch }) {
	const [copied, setCopied] = useState(false)
	// hex가 깨진 데이터면 파생 계산이 던지므로 색면을 포기하고 텍스트만 남긴다.
	const valid = isValidHex(swatch.hex)
	const rgb = valid ? hexToRgb(swatch.hex) : null

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
			className="flex h-44 cursor-pointer flex-col justify-between p-4 text-left font-body text-xs outline-none ring-foreground/60 transition-transform hover:z-10 hover:scale-105 focus-visible:ring-2"
			style={
				valid
					? { backgroundColor: swatch.hex, color: getContrastingForeground(swatch.hex) }
					: undefined
			}
		>
			<span className="font-medium">{copied ? '✓ 복사됨' : swatch.name}</span>
			{/* 값이 없는 줄도 라벨을 남긴다 — 브랜드팀에서 아직 안 온 항목이 화면에서 보이게. */}
			<dl className="grid grid-cols-[2.75rem_1fr] tabular-nums">
				<Spec label="HEX" value={swatch.hex} />
				<Spec label="RGB" value={rgb && `${rgb.r} ${rgb.g} ${rgb.b}`} />
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
