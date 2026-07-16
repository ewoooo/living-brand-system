import sharp from 'sharp'
import type { Rgb } from '@/features/asset-check/checkers/palette-match'
import type { PixelGrid } from '@/features/asset-check/checkers/types'

/**
 * AI 비전 요청용 이미지 축소 (외부 I/O = sharp 리사이즈).
 * Claude vision은 긴 변 1568px 초과 이미지를 서버에서 축소하고, 여러 이미지를 싣는 요청은
 * 한 변 2000px 초과 시 400으로 거부하므로 전송 전에 1568px 이내로 맞춘다. 포맷은 유지한다.
 */
export async function resizeForAiVision(buffer: Buffer, maxDim = 1568): Promise<Buffer> {
	try {
		const image = sharp(buffer)
		const { width, height } = await image.metadata()
		if (!width || !height || (width <= maxDim && height <= maxDim)) return buffer
		return await image
			.resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
			.toBuffer()
	} catch {
		// 리사이즈는 최적화다 — 디코딩 못 하는 버퍼는 원본 그대로 보낸다.
		return buffer
	}
}

/**
 * AI 비전 요청용 레퍼런스 이미지 압축 (외부 I/O = sharp 변환).
 * 레퍼런스는 판정 맥락용이라 1024px WebP로 줄인다 — 원본 사진 PNG를 그대로 실으면
 * 배치 하나의 레퍼런스만으로 요청 한도(32MB)를 넘는다. WebP는 alpha를 보존한다.
 */
export async function compressForAiReference(
	buffer: Buffer,
	fallbackMediaType: string,
	maxDim = 1024,
): Promise<{ data: Buffer; mediaType: string }> {
	try {
		const data = await sharp(buffer)
			.resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer()
		return { data, mediaType: 'image/webp' }
	} catch {
		// 압축은 최적화다 — 디코딩 못 하는 버퍼는 원본 그대로 보낸다.
		return { data: buffer, mediaType: fallbackMediaType }
	}
}

/**
 * 이미지 버퍼에서 검수용 2D 픽셀 그리드를 추출한다 (외부 I/O = sharp 디코딩).
 * flat 디자인 색·형태 검수용이라 보간 없는 nearest 축소로 원본 색을 보존하고 alpha를 유지한다.
 * 상위 service는 그리드만 받고 이미지 포맷·디코딩은 알지 않는다.
 */
export async function extractPixelGrid(buffer: Buffer, maxDim = 128): Promise<PixelGrid> {
	const { data, info } = await sharp(buffer)
		.resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true, kernel: 'nearest' })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true })

	const size = info.width * info.height
	const pixels: Rgb[] = new Array(size)
	const alpha = new Uint8Array(size)
	for (let i = 0, p = 0; p < size; i += 4, p++) {
		pixels[p] = { r: data[i], g: data[i + 1], b: data[i + 2] }
		alpha[p] = data[i + 3]
	}

	return { width: info.width, height: info.height, pixels, alpha }
}
