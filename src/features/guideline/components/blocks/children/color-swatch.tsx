'use client'

import { useState } from 'react'
import { hexToRgb, isLightColor, isValidHex } from '@/lib/color'

// 클릭하면 HEX를 클립보드에 복사하는 라이브 스와치. 캡쳐 이미지가 아니라 실제 색 데이터로 렌더한다.
export type SwatchColor = {
	/** 색 이름 — 스와치 좌상단에 굵게 표시. */
	name: string
	/** HEX 코드(#RRGGBB) — 배경색이자 클릭 시 복사되는 값. */
	hex: string
	/** 팬톤(PMS) 번호(선택) — 값이 있으면 "PMS …" 줄이 추가된다. */
	pantone?: string | null
}

/**
 * 클릭하면 HEX를 클립보드에 복사하는 라이브 색 스와치 — 캡쳐 이미지가 아니라 실제 색 데이터로 렌더. 컬러 팔레트 그리드의 셀로 페이지에 그대로 드롭인.
 *
 * @example 단일 스와치
 * <ColorSwatch color={{ name: '브랜드 그린', hex: '#0A7D4B' }} />
 *
 * @example 팬톤 포함 — PMS 줄이 함께 표시
 * <ColorSwatch color={{ name: '메인 컬러', hex: '#0A7D4B', pantone: '355 C' }} />
 */
export function ColorSwatch({
	color,
}: {
	/** 표시할 색 한 건 — 이름·HEX·(선택)팬톤. */
	color: SwatchColor
}) {
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
			className="group relative flex aspect-square cursor-pointer flex-col rounded-md border border-scrim/10 p-4 text-left font-body text-xs font-normal outline-none ring-foreground/60 transition-shadow focus-visible:ring-2"
			style={{ backgroundColor: color.hex, color: fg }}
		>
			<span className="font-body text-xs font-medium">{color.name}</span>
			<span className="tabular-nums">HEX {color.hex}</span>
			{rgbLabel(color.hex) && <span className="tabular-nums">RGB {rgbLabel(color.hex)}</span>}
			{color.pantone && <span>PMS {color.pantone}</span>}

			<span
				aria-live="polite"
				className="mt-auto self-start rounded-full px-2 py-0.5 font-body text-xs font-medium opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70"
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
