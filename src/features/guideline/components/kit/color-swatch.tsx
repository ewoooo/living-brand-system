'use client'

import { useState } from 'react'
import { hexToRgb, isLightColor, isValidHex } from '@/lib/color'

// 클릭하면 HEX를 클립보드에 복사하는 라이브 스와치. 캡쳐 이미지가 아니라 실제 색 데이터로 렌더한다.
export type SwatchColor = { name: string; hex: string; pantone?: string | null }

export function ColorSwatch({ color }: { color: SwatchColor }) {
	const [copied, setCopied] = useState(false)
	const light = isValidHex(color.hex) && isLightColor(color.hex)
	const fg = light ? '#000000' : '#FFFFFF'

	async function copy() {
		// 성공했을 때만 "복사됨" 표시 — 거짓 피드백 방지.
		// ponytail: 프리뷰 iframe은 clipboard-write 권한이 없어 둘 다 막히지만,
		// 실제 브라우저 탭에서는 사용자 클릭 제스처로 열린다.
		if (await copyText(color.hex)) {
			setCopied(true)
			setTimeout(() => setCopied(false), 1200)
		}
	}

	return (
		<button
			type="button"
			onClick={copy}
			title={`${color.hex} 복사`}
			className="type-caption-1 group relative flex aspect-square cursor-pointer flex-col rounded-md border border-scrim/10 p-4 text-left outline-none ring-foreground/60 transition-shadow focus-visible:ring-2"
			style={{ backgroundColor: color.hex, color: fg }}
		>
			<span className="type-caption-1-emphasized">{color.name}</span>
			<span className="tabular-nums">HEX {color.hex}</span>
			{rgbLabel(color.hex) && <span className="tabular-nums">RGB {rgbLabel(color.hex)}</span>}
			{color.pantone && <span>PMS {color.pantone}</span>}

			<span
				aria-live="polite"
				className="type-caption-1-emphasized mt-auto self-start rounded-full px-2 py-0.5 opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70"
				style={{ backgroundColor: light ? '#00000012' : '#FFFFFF20' }}
			>
				{copied ? '✓ 복사됨' : '클릭해서 복사'}
			</span>
		</button>
	)
}

function rgbLabel(hex: string) {
	if (!isValidHex(hex)) return null
	const { r, g, b } = hexToRgb(hex)
	return `${r}/${g}/${b}`
}

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
