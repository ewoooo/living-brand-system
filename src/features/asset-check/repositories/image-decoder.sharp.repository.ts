import sharp from 'sharp'
import type { Rgb } from '@/features/asset-check/checkers/color/palette-match'
import type { PixelGrid } from '@/features/asset-check/checkers/types'

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
