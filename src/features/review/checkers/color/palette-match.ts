/**
 * Palette match helper — 색을 CIELAB으로 변환해 deltaE(CIE76)로 가장 가까운 swatch를 찾는다.
 * 픽셀 추출과 기준 팔레트 조회는 상위 레이어가 소유한다.
 */

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
 * 한 픽셀 색이 "팔레트 안"으로 인정되는 deltaE(CIE76) 허용 오차.
 * 사람 눈에 거의 같다고 보는 범위(≈10) 기준.
 */
export const PALETTE_DELTA_E_TOLERANCE = 12

interface Lab {
	l: number
	a: number
	b: number
}

export function hexToRgb(hex: string): Rgb {
	const v = Number.parseInt(hex.replace(/^#/, ''), 16)
	return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff }
}

function srgbToLinear(c: number): number {
	const x = c / 255
	return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}

/** sRGB → CIELAB (D65). deltaE76 비교용. */
function rgbToLab({ r, g, b }: Rgb): Lab {
	const lr = srgbToLinear(r)
	const lg = srgbToLinear(g)
	const lb = srgbToLinear(b)

	const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047
	const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722
	const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883

	const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
	const fx = f(x)
	const fy = f(y)
	const fz = f(z)

	return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

function deltaE(a: Lab, b: Lab): number {
	return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2)
}

/** 한 색에 가장 가까운 swatch와 그 deltaE. 역할/그룹 판정(color.roles 등)에 쓴다. */
export function nearestSwatch(rgb: Rgb, swatches: Swatch[]): { swatch: Swatch; distance: number } {
	const lab = rgbToLab(rgb)
	let best = swatches[0]
	let min = Number.POSITIVE_INFINITY
	for (const swatch of swatches) {
		const d = deltaE(lab, rgbToLab(hexToRgb(swatch.hex)))
		if (d < min) {
			min = d
			best = swatch
		}
	}
	return { swatch: best, distance: min }
}
