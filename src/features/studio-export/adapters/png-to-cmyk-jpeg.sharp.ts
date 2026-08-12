import sharp from 'sharp'
import { MAX_PRINT_PIXELS } from '../print-policy'

/** PNG를 흰 배경의 CMYK JPEG로 변환하고 ICC 프로파일을 첨부한다. */
export async function pngToCmykJpeg(buffer: Buffer, icc: string): Promise<Buffer | null> {
	try {
		return await sharp(buffer, { limitInputPixels: MAX_PRINT_PIXELS })
			.flatten({ background: '#ffffff' })
			.toColourspace('cmyk')
			.withIccProfile(icc)
			.jpeg({ chromaSubsampling: '4:4:4', quality: 100 })
			.toBuffer()
	} catch {
		return null
	}
}
