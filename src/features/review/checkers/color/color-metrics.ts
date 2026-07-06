/**
 * Color metric helper — 픽셀/색상에서 명도, 채도, 대비, 지배색 같은 측정값을 뽑는다.
 * 룰 판정은 하지 않고 checker들이 공유하는 계산만 제공한다.
 */
import type { PixelGrid } from '../types'
import type { Rgb } from './palette-match'

/** WCAG relative luminance (0~1) */
export function relativeLuminance({ r, g, b }: Rgb): number {
	const lin = (c: number) => {
		const x = c / 255
		return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
	}
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio (1~21) */
export function contrastRatio(a: Rgb, b: Rgb): number {
	const la = relativeLuminance(a)
	const lb = relativeLuminance(b)
	const hi = Math.max(la, lb)
	const lo = Math.min(la, lb)
	return (hi + 0.05) / (lo + 0.05)
}

/** HSL lightness (0~1) */
export function lightness({ r, g, b }: Rgb): number {
	return (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255
}

/** HSL saturation (0~1) */
export function saturation({ r, g, b }: Rgb): number {
	const mx = Math.max(r, g, b) / 255
	const mn = Math.min(r, g, b) / 255
	if (mx === mn) return 0
	const l = (mx + mn) / 2
	const d = mx - mn
	return l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
}

export interface DominantColor {
	rgb: Rgb
	/** 전체 픽셀 대비 점유율 (0~1) */
	share: number
}

/**
 * 픽셀을 6비트로 양자화해 점유율 상위 대표색을 뽑는다 (점유율 share 포함).
 * 팔레트 매칭이 아니라 "함께 쓰인 주요 색"을 근사한다 — 여러 checker가 공유한다.
 */
export function dominantColors(pixels: Rgb[], topN = 8, minShare = 0.03): DominantColor[] {
	if (pixels.length === 0) return []
	const buckets = new Map<string, { r: number; g: number; b: number; count: number }>()
	for (const p of pixels) {
		const key = `${p.r >> 2}-${p.g >> 2}-${p.b >> 2}`
		const bucket = buckets.get(key)
		if (bucket) {
			bucket.r += p.r
			bucket.g += p.g
			bucket.b += p.b
			bucket.count += 1
		} else {
			buckets.set(key, { r: p.r, g: p.g, b: p.b, count: 1 })
		}
	}
	const total = pixels.length
	return [...buckets.values()]
		.filter((bucket) => bucket.count / total >= minShare)
		.sort((a, b) => b.count - a.count)
		.slice(0, topN)
		.map((bucket) => ({
			rgb: {
				r: Math.round(bucket.r / bucket.count),
				g: Math.round(bucket.g / bucket.count),
				b: Math.round(bucket.b / bucket.count),
			},
			share: bucket.count / total,
		}))
}

/** grid에서 color 검수용 flat 픽셀(불투명)을 파생한다. */
export function opaquePixels(grid: PixelGrid): Rgb[] {
	const out: Rgb[] = []
	for (let i = 0; i < grid.pixels.length; i++) {
		if (grid.alpha[i] > 0) out.push(grid.pixels[i])
	}
	return out
}
