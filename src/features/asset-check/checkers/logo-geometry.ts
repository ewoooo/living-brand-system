/**
 * Logo geometry helper — 픽셀 grid에서 로고 전경 마스크, bbox, stem width를 추정한다.
 * 로고 관련 geometry checker들이 공유하며 직접 rule 판정은 하지 않는다.
 */
import type { PixelGrid } from './types'
import { dominantColors } from './color-metrics'
import type { Rgb } from './palette-match'

// 알파(0–255)가 이 값 미만이면 투명 픽셀로 본다 — 안티앨리어싱 가장자리 노이즈 컷.
const ALPHA_MIN = 8
// flat 디자인에서 배경색과 이만큼(RGB 거리) 떨어지면 전경으로 본다.
const FG_TOL = 48
// 전경 픽셀이 이보다 적으면 로고가 없는 것으로 본다 — 노이즈 오검출 방지.
const MIN_FG_PIXELS = 8

export interface LogoRegion {
	width: number
	height: number
	/** 1=전경(로고), row-major */
	mask: Uint8Array
	bbox: { x0: number; y0: number; x1: number; y1: number }
}

function colorDist(a: Rgb, b: Rgb): number {
	const dr = a.r - b.r
	const dg = a.g - b.g
	const db = a.b - b.b
	return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * 전경(로고) 영역을 추출한다. 투명 배경이면 alpha로, 불투명 flat 배경이면
 * 최빈색을 배경으로 잡아 그와 다른 픽셀을 전경으로 본다. 전경이 거의 없으면 null.
 */
export function detectLogoRegion(grid: PixelGrid): LogoRegion | null {
	const { width: w, height: h, pixels, alpha } = grid
	const n = w * h

	let transparent = 0
	for (let i = 0; i < n; i++) if (alpha[i] < ALPHA_MIN) transparent++
	const transparentBg = transparent / n > 0.5

	let bg: Rgb = { r: 255, g: 255, b: 255 }
	if (!transparentBg) {
		const opaque: Rgb[] = []
		for (let i = 0; i < n; i++) if (alpha[i] >= ALPHA_MIN) opaque.push(pixels[i])
		const dom = dominantColors(opaque, 1, 0)
		if (dom.length > 0) bg = dom[0].rgb
	}

	const mask = new Uint8Array(n)
	let fgCount = 0
	let x0 = w
	let y0 = h
	let x1 = -1
	let y1 = -1
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x
			const isFg = transparentBg
				? alpha[i] >= ALPHA_MIN
				: alpha[i] >= ALPHA_MIN && colorDist(pixels[i], bg) > FG_TOL
			if (!isFg) continue
			mask[i] = 1
			fgCount++
			if (x < x0) x0 = x
			if (x > x1) x1 = x
			if (y < y0) y0 = y
			if (y > y1) y1 = y
		}
	}
	if (fgCount < MIN_FG_PIXELS || x1 < 0) return null

	return { width: w, height: h, mask, bbox: { x0, y0, x1, y1 } }
}

/**
 * 획 두께(stem width)를 근사한다 — 전경 마스크의 가로 run 길이 중앙값.
 * 워드마크를 가로로 훑으면 세로획을 자주 지나가 run 길이가 획 두께에 수렴한다.
 * clear-space 모듈(=stem×3) 등 로고 상대 크기 기준의 재료.
 */
export function estimateStemWidth(region: LogoRegion): number {
	const { width: w, mask, bbox } = region
	const runs: number[] = []
	for (let y = bbox.y0; y <= bbox.y1; y++) {
		let run = 0
		for (let x = bbox.x0; x <= bbox.x1; x++) {
			if (mask[y * w + x]) {
				run++
			} else if (run > 0) {
				runs.push(run)
				run = 0
			}
		}
		if (run > 0) runs.push(run)
	}
	if (runs.length === 0) return 1
	runs.sort((a, b) => a - b)
	return runs[Math.floor(runs.length / 2)] || 1
}
