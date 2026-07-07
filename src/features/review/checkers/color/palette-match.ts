/**
 * Palette match helper — 색을 CIELAB 기반 deltaE(CIEDE2000, culori)로 비교해 가장 가까운 swatch를 찾는다.
 * 픽셀 추출과 기준 팔레트 조회는 상위 레이어가 소유한다.
 */
import { converter, differenceCiede2000 } from 'culori'

export interface Rgb {
	r: number
	g: number
	b: number
}

export type SwatchFamily = 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray' | 'extreme'

export interface Swatch {
	name: string
	hex: string
	family: SwatchFamily
}

/**
 * 한 픽셀 색이 "팔레트 안"으로 인정되는 deltaE(CIEDE2000) 허용 오차.
 * JND(≈2.3)보다 넉넉하되 인접 팔레트 톤(ΔE00 ≈ 20+)과는 충분히 떨어진 값.
 * 양자화·안티앨리어싱 노이즈는 ΔE00 1 미만, 규정 외 색은 15 이상으로 측정됨.
 */
export const PALETTE_DELTA_E_TOLERANCE = 6

const toLab = converter('lab')
const deltaE00 = differenceCiede2000()

export function hexToRgb(hex: string): Rgb {
	const v = Number.parseInt(hex.replace(/^#/, ''), 16)
	return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff }
}

/** 0–255 Rgb → culori Lab (deltaE00 입력용) */
function labOf({ r, g, b }: Rgb) {
	return toLab({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 })
}

/** 한 색에 가장 가까운 swatch와 그 deltaE. 역할/그룹 판정(color.roles 등)에 쓴다. */
export function nearestSwatch(rgb: Rgb, swatches: Swatch[]): { swatch: Swatch; distance: number } {
	const lab = labOf(rgb)
	let best = swatches[0]
	let min = Number.POSITIVE_INFINITY
	for (const swatch of swatches) {
		const d = deltaE00(lab, labOf(hexToRgb(swatch.hex)))
		if (d < min) {
			min = d
			best = swatch
		}
	}
	return { swatch: best, distance: min }
}
