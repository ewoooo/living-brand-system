/**
 * color.palette 검수 엔진 (순수 함수, I/O 없음).
 *
 * RuleSpec `color.palette`의 scoring("Per sampled color nearest-swatch deltaE;
 * off-palette fail")을 그대로 구현한다. 입력 픽셀 각각을 가장 가까운 지정 swatch에
 * deltaE(CIE76)로 매칭하고, 허용 오차 안에 든 비율을 충족률로 돌려준다.
 * 픽셀 추출(canvas)·기준값(palette)은 상위 레이어가 소유하고 여기엔 넘기기만 한다.
 */

import type { Swatch } from './essenherb-palette'

export interface Rgb {
	r: number
	g: number
	b: number
}

interface Lab {
	l: number
	a: number
	b: number
}

export interface OffPaletteColor {
	hex: string
	share: number
}

export interface ColorCheckResult {
	/** 충족률 %: 팔레트 안에 든 픽셀 비율 (0–100) */
	fulfillment: number
	/** fulfillment >= threshold */
	pass: boolean
	threshold: number
	sampled: number
	matched: number
	/** 팔레트 밖 색을 빈도순으로 (상위 일부) */
	offPalette: OffPaletteColor[]
}

export function hexToRgb(hex: string): Rgb {
	const v = Number.parseInt(hex.replace(/^#/, ''), 16)
	return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff }
}

function rgbToHex({ r, g, b }: Rgb): string {
	const h = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
	return `${h(r)}${h(g)}${h(b)}`
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

/** 한 색에서 가장 가까운 swatch까지의 deltaE. */
export function nearestSwatchDistance(rgb: Rgb, paletteLab: Lab[]): number {
	const lab = rgbToLab(rgb)
	let min = Number.POSITIVE_INFINITY
	for (const swatchLab of paletteLab) {
		const d = deltaE(lab, swatchLab)
		if (d < min) min = d
	}
	return min
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

/**
 * 픽셀들을 팔레트에 비춰 충족률을 판정한다.
 * 팔레트 밖 픽셀은 6비트로 양자화해 대표 색을 빈도순으로 추린다.
 */
export function checkColorPalette(
	pixels: Rgb[],
	swatches: Swatch[],
	threshold: number,
	tolerance: number,
): ColorCheckResult {
	const paletteLab = swatches.map((s) => rgbToLab(hexToRgb(s.hex)))

	let matched = 0
	const offBuckets = new Map<string, { rgb: Rgb; count: number }>()

	for (const px of pixels) {
		if (nearestSwatchDistance(px, paletteLab) <= tolerance) {
			matched++
			continue
		}
		const key = `${px.r >> 2}-${px.g >> 2}-${px.b >> 2}`
		const bucket = offBuckets.get(key)
		if (bucket) bucket.count++
		else offBuckets.set(key, { rgb: px, count: 1 })
	}

	const sampled = pixels.length
	const fulfillment = sampled === 0 ? 0 : (matched / sampled) * 100

	const offPalette = [...offBuckets.values()]
		.sort((a, b) => b.count - a.count)
		.slice(0, 8)
		.map((b) => ({ hex: rgbToHex(b.rgb), share: (b.count / sampled) * 100 }))

	return {
		fulfillment: Math.round(fulfillment * 10) / 10,
		pass: fulfillment >= threshold,
		threshold,
		sampled,
		matched,
		offPalette,
	}
}
