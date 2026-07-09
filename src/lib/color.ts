/** 색 계산 공통 유틸. hex 파싱은 6자리(#RRGGBB)를 가정한다. */
import { rgb } from 'culori'

export interface Rgb {
	r: number
	g: number
	b: number
}

export function hexToRgb(hex: string): Rgb {
	// culori는 0–1을 돌려주므로 0–255 정수로 복원한다. rgbLabel 등 정수 표시 계약 유지.
	const c = rgb(hex.startsWith('#') ? hex : `#${hex}`)
	if (!c) throw new Error(`Invalid hex color: ${hex}`)
	return {
		r: Math.round(c.r * 255),
		g: Math.round(c.g * 255),
		b: Math.round(c.b * 255),
	}
}

export function isValidHex(hex: string): boolean {
	return /^#?[0-9a-fA-F]{6}$/.test(hex)
}

/** 스와치 위 텍스트의 흑/백 선택용 밝기 판정 (YIQ 근사). */
export function isLightColor(hex: string): boolean {
	const { r, g, b } = hexToRgb(hex)
	return (r * 299 + g * 587 + b * 114) / 1000 > 150
}
