import sharp from 'sharp'
import type { PrintPpi } from '../print-policy'
import { MAX_PRINT_PIXELS } from '../print-policy'

/** PNG를 흰 배경의 CMYK TIFF로 변환하고 PPI와 ICC 프로파일을 첨부한다. */
export async function pngToCmykTiff(
	buffer: Buffer,
	ppi: PrintPpi,
	icc: string,
): Promise<Buffer | null> {
	try {
		return await sharp(buffer, { limitInputPixels: MAX_PRINT_PIXELS })
			.flatten({ background: '#ffffff' })
			.withMetadata({ density: ppi })
			.toColourspace('cmyk')
			.withIccProfile(icc)
			.tiff({ compression: 'lzw' })
			.toBuffer()
	} catch {
		return null
	}
}
