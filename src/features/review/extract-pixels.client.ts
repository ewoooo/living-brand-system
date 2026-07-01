import type { Rgb } from '@/features/review/color-check'

/**
 * 브라우저에서 이미지 URL을 canvas로 다운샘플해 픽셀 배열을 뽑는다 (클라이언트 전용).
 * 서버 sharp 추출의 클라이언트 대응 — API 없이 review 페이지에서 바로 검수하기 위함.
 */
export function loadPixelsFromUrl(url: string, maxDim = 128): Promise<Rgb[]> {
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
			// flat 디자인 색 검수용 — 보간 끄고 nearest로 원본 색 보존(경계 블렌드로 인한 가짜 off-palette 방지)
			ctx.imageSmoothingEnabled = false
			ctx.drawImage(img, 0, 0, w, h)
			const { data } = ctx.getImageData(0, 0, w, h)
			const pixels: Rgb[] = []
			for (let i = 0; i + 3 < data.length; i += 4) {
				if (data[i + 3] > 0) pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
			}
			resolve(pixels)
		}
		img.onerror = () => reject(new Error('image load failed'))
		img.src = url
	})
}
