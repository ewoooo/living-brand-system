import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { resolveCmykIccProfilePath } from '../color-profile.server'
import { pngToCmykJpeg } from './png-to-cmyk-jpeg.sharp'

/** APP2(0xFFE2) 세그먼트를 전부 걷어낸다 — ICC 프로파일이 실리는 자리다. */
function stripApp2(buf: Buffer): Buffer {
	const out: Buffer[] = [buf.subarray(0, 2)]
	let i = 2
	while (i < buf.length - 1) {
		if (buf[i] !== 0xff) break
		const marker = buf[i + 1]
		if (marker === 0xda) {
			out.push(buf.subarray(i))
			break
		}
		const length = buf.readUInt16BE(i + 2)
		if (marker !== 0xe2) out.push(buf.subarray(i, i + 2 + length))
		i += 2 + length
	}
	return Buffer.concat(out)
}

describe('pngToCmykJpeg', () => {
	/**
	 * 🔴 ICC 프로파일이 3.46MB라, 첨부하면 이미지 한 장마다 그만큼 붙어 한 페이지 PDF가 7MB가
	 * 됐다. PDF는 `/ColorSpace`로 프로파일을 한 벌만 실으므로 JPEG 쪽 첨부는 순수 중복이다.
	 * 이 검사는 「빠진 것이 프로파일뿐이고 픽셀은 그대로」임을 잠근다.
	 */
	it('프로파일을 첨부하지 않지만 변환 결과는 첨부본과 바이트가 같다', async () => {
		const icc = resolveCmykIccProfilePath('cgats21-crpc6')
		const png = await sharp({
			create: { width: 64, height: 64, channels: 3, background: '#00ad45' },
		})
			.png()
			.toBuffer()

		const bare = await pngToCmykJpeg(png, icc)
		expect(bare).not.toBeNull()
		// 🔑 대조본은 `pngToCmykJpeg`와 **같은 순서**여야 한다 — `toColourspace('cmyk')`를 앞에
		//    넣으면 이중 변환이 되어 픽셀 자체가 달라진다(그 자체가 별개의 결함이었다).
		const attached = await sharp(png)
			.flatten({ background: '#ffffff' })
			.withIccProfile(icc)
			.jpeg({ chromaSubsampling: '4:4:4', quality: 100 })
			.toBuffer()

		expect(bare?.includes(Buffer.from('ICC_PROFILE'))).toBe(false)
		expect(attached.includes(Buffer.from('ICC_PROFILE'))).toBe(true)
		expect(Buffer.compare(stripApp2(attached), bare as Buffer)).toBe(0)
		// 첨부본이 3MB 넘게 큰 것이 이 고침의 이유다.
		expect(attached.length - (bare as Buffer).length).toBeGreaterThan(3_000_000)
	})
})
