export const CHECK_IMAGE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type CheckImageMediaType = (typeof CHECK_IMAGE_MEDIA_TYPES)[number]

export const CHECK_IMAGE_ACCEPT = CHECK_IMAGE_MEDIA_TYPES.join(',')

export function isSupportedCheckImageMediaType(
	mediaType: string,
): mediaType is CheckImageMediaType {
	return CHECK_IMAGE_MEDIA_TYPES.some((supported) => supported === mediaType)
}

export function detectCheckImageMediaType(data: Uint8Array): CheckImageMediaType | undefined {
	if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg'
	if (
		data[0] === 0x89 &&
		data[1] === 0x50 &&
		data[2] === 0x4e &&
		data[3] === 0x47 &&
		data[4] === 0x0d &&
		data[5] === 0x0a &&
		data[6] === 0x1a &&
		data[7] === 0x0a
	) {
		return 'image/png'
	}
	if (
		data[0] === 0x52 &&
		data[1] === 0x49 &&
		data[2] === 0x46 &&
		data[3] === 0x46 &&
		data[8] === 0x57 &&
		data[9] === 0x45 &&
		data[10] === 0x42 &&
		data[11] === 0x50
	) {
		return 'image/webp'
	}
}
