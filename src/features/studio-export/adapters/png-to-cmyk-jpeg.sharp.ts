import sharp from 'sharp'
import { MAX_PRINT_PIXELS } from '../print-policy'

/**
 * PNG를 흰 배경의 CMYK JPEG로 변환한다.
 * 🔴 프로파일은 첨부하지 않는다 — 이 JPEG은 PDF 안으로만 들어가고 색 관리는 PDF의
 *    `/ColorSpace`가 갖는다. 사용자에게 그대로 나가는 TIFF(`png-to-cmyk-tiff`)는 반대로
 *    **첨부해야 한다** — 붙은 프로파일이 그 파일의 유일한 색 관리다.
 */
export async function pngToCmykJpeg(buffer: Buffer, icc: string): Promise<Buffer | null> {
	try {
		return await sharp(buffer, { limitInputPixels: MAX_PRINT_PIXELS })
			.flatten({ background: '#ffffff' })
			.toColourspace('cmyk')
			.withIccProfile(icc, { attach: false })
			.jpeg({ chromaSubsampling: '4:4:4', quality: 100 })
			.toBuffer()
	} catch {
		return null
	}
}
