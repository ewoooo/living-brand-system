import type { PixelGrid } from '@/features/review/checkers/types'
import type { Rgb } from '@/features/review/color-check'

/**
 * 브라우저에서 이미지 URL을 canvas로 다운샘플해 2D 픽셀 그리드를 뽑는다 (클라이언트 전용).
 * 서버 sharp 추출의 클라이언트 대응 — API 없이 review 페이지에서 바로 검수하기 위함.
 * color 검수용 flat 픽셀은 이 grid에서 파생한다(불투명만).
 */
export function loadPixelGridFromUrl(url: string, maxDim = 128): Promise<PixelGrid> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => {
			const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
			const w = Math.max(1, Math.round(img.width * scale))
			const h = Math.max(1, Math.round(img.height * scale))
			const canvas = document.createElement('canvas')
			canvas.width = w
			canvas.height = h
			const ctx = canvas.getContext('2d')
			if (!ctx) {
				reject(new Error('canvas context unavailable'))
				return
			}
			// flat 디자인 색·형태 검수용 — 보간 끄고 nearest로 원본 색 보존(경계 블렌드로 인한 가짜 색·엣지 방지)
			ctx.imageSmoothingEnabled = false
			ctx.drawImage(img, 0, 0, w, h)
			const { data } = ctx.getImageData(0, 0, w, h)
			const pixels: Rgb[] = new Array(w * h)
			const alpha = new Uint8Array(w * h)
			for (let i = 0, p = 0; i + 3 < data.length; i += 4, p++) {
				pixels[p] = { r: data[i], g: data[i + 1], b: data[i + 2] }
				alpha[p] = data[i + 3]
			}
			resolve({ width: w, height: h, pixels, alpha })
		}
		img.onerror = () => reject(new Error('image load failed'))
		img.src = url
	})
}

/** grid에서 color 검수용 flat 픽셀(불투명)을 파생한다. */
export function opaquePixels(grid: PixelGrid): Rgb[] {
	const out: Rgb[] = []
	for (let i = 0; i < grid.pixels.length; i++) {
		if (grid.alpha[i] > 0) out.push(grid.pixels[i])
	}
	return out
}
