import sharp from 'sharp'
import type { Rgb } from '@/features/review/color-check'

/**
 * 이미지 버퍼에서 검수용 픽셀 샘플을 추출한다 (외부 I/O = sharp 디코딩).
 * 상위 service는 픽셀 배열만 받고 이미지 포맷·디코딩은 알지 않는다.
 */
export async function extractPixels(buffer: Buffer, maxDim = 64): Promise<Rgb[]> {
	const { data } = await sharp(buffer)
		.resize(maxDim, maxDim, { fit: 'inside' })
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true })

	const pixels: Rgb[] = []
	for (let i = 0; i + 2 < data.length; i += 3) {
		pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
	}
	return pixels
}
