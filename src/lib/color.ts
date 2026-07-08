/** 색 계산 공통 유틸. hex 파싱은 6자리(#RRGGBB)를 가정한다. */

export interface Rgb {
	r: number
	g: number
	b: number
}

export function hexToRgb(hex: string): Rgb {
	const v = Number.parseInt(hex.replace(/^#/, ''), 16)
	return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff }
}

export function isValidHex(hex: string): boolean {
	return /^#?[0-9a-fA-F]{6}$/.test(hex)
}

/** 스와치 위 텍스트의 흑/백 선택용 밝기 판정 (YIQ 근사). */
export function isLightColor(hex: string): boolean {
	const { r, g, b } = hexToRgb(hex)
	return (r * 299 + g * 587 + b * 114) / 1000 > 150
}
