import sharp from 'sharp'

const MAX_IMAGE_BYTES = 20_000_000
const MAX_IMAGE_PIXELS = 16_777_216

export interface DecodedImageDataUri {
	data: Buffer
	extension: 'jpg' | 'png' | 'webp'
	mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
}

/** 외부 생성 결과와 사용자 시드의 MIME·실제 이미지 형식·크기 상한을 함께 검증한다. */
export async function decodeImageDataUri(value: string): Promise<DecodedImageDataUri> {
	const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
	if (!match) throw new Error('Invalid image data URI.')

	const format = match[1] as 'jpeg' | 'png' | 'webp'
	const data = Buffer.from(match[2], 'base64')
	if (data.byteLength === 0 || data.byteLength > MAX_IMAGE_BYTES) {
		throw new Error('Invalid image data URI.')
	}

	const metadata = await sharp(data, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata()
	if (metadata.format !== format) throw new Error('Invalid image data URI.')

	return {
		data,
		extension: format === 'jpeg' ? 'jpg' : format,
		mimeType: `image/${format}`,
	}
}
