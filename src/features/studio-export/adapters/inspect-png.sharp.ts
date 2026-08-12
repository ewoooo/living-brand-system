import sharp from 'sharp'
import { MAX_PRINT_PIXELS } from '../print-policy'

/** PNG의 포맷과 픽셀 크기를 읽고 손상된 입력은 null로 정규화한다. */
export async function inspectPng(
	buffer: Buffer,
): Promise<{ width: number; height: number } | null> {
	try {
		const image = sharp(buffer, { limitInputPixels: MAX_PRINT_PIXELS })
		const metadata = await image.metadata()
		if (metadata.format !== 'png' || !metadata.width || !metadata.height) return null
		await image.toBuffer()
		return { width: metadata.width, height: metadata.height }
	} catch {
		return null
	}
}
