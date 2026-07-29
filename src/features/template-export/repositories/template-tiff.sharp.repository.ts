import sharp from 'sharp'
import { MAX_PRINT_PIXELS, type PrintPpi } from '../print-policy'

/**
 * 업로드 PNG의 포맷·픽셀 크기를 읽는다. 이미지 디코딩 I/O와 픽셀 상한은 Sharp 계층이 소유한다.
 */
export async function inspectTemplatePng(
	buffer: Buffer,
): Promise<{ width: number; height: number } | null> {
	try {
		const metadata = await sharp(buffer, { limitInputPixels: MAX_PRINT_PIXELS }).metadata()
		if (metadata.format !== 'png' || !metadata.width || !metadata.height) return null
		return { width: metadata.width, height: metadata.height }
	} catch {
		return null
	}
}

/**
 * PNG를 흰 배경의 기본 CMYK 프로파일 TIFF로 변환한다. 리사이즈는 하지 않고 PPI 메타데이터만 쓴다.
 */
export async function convertTemplatePngToTiff(
	buffer: Buffer,
	ppi: PrintPpi,
): Promise<Buffer | null> {
	try {
		return await sharp(buffer, { limitInputPixels: MAX_PRINT_PIXELS })
			.flatten({ background: '#ffffff' })
			.withMetadata({ density: ppi })
			.toColourspace('cmyk')
			.withIccProfile('cmyk')
			.tiff({ compression: 'lzw' })
			.toBuffer()
	} catch {
		return null
	}
}
