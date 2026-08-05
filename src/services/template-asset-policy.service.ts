const TEMPLATE_VECTOR_ASSET_COLLECTIONS = ['brand-logos', 'application-images'] as const

export const AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS = [
	...TEMPLATE_VECTOR_ASSET_COLLECTIONS,
	'generated-images',
] as const

export type TemplateVectorAssetCollection = (typeof TEMPLATE_VECTOR_ASSET_COLLECTIONS)[number]
export type AuthorizedTemplateAssetCollection =
	(typeof AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS)[number]

export interface AuthorizedTemplateImageRef {
	collection: AuthorizedTemplateAssetCollection
	assetId: number
	src: string
	label: string
}

const MAX_RASTER_BYTES = 10 * 1024 * 1024
const MAX_RASTER_DATA_URL_LENGTH =
	'data:image/jpeg;base64,'.length + 4 * Math.ceil(MAX_RASTER_BYTES / 3)

/** 템플릿 문자열에 HTML·CSS 파서를 우회할 수 있는 제어 문자가 있는지 판정한다. */
export function hasUnsafeTemplateControlCharacter(value: string, allowWhitespace = false): boolean {
	for (const character of value) {
		const code = character.charCodeAt(0)
		if (code === 127 || (code < 32 && (!allowWhitespace || ![9, 10, 13].includes(code)))) {
			return true
		}
	}
	return false
}

/** 문자열이 공개 템플릿에서 참조할 수 있는 에셋 컬렉션인지 좁힌다. */
export function isAuthorizedTemplateAssetCollection(
	value: string,
): value is AuthorizedTemplateAssetCollection {
	return (AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS as readonly string[]).includes(value)
}

/** 쿼리·해시 없는 내부 Payload 파일 URL인지 검사한다. */
export function isCanonicalTemplateAssetUrl(
	value: string,
	collections: readonly string[],
): boolean {
	if (
		!value.startsWith('/') ||
		value.startsWith('//') ||
		value.includes('?') ||
		value.includes('#') ||
		value.includes('\\') ||
		hasUnsafeTemplateControlCharacter(value)
	) {
		return false
	}

	const url = new URL(value, 'http://template.local')
	if (url.pathname !== value) return false
	return collections.some((collection) => value.startsWith(`/api/${collection}/file/`))
}

function isSafeRasterDataUrl(value: string): boolean {
	if (value.length > MAX_RASTER_DATA_URL_LENGTH) return false
	const match = value.match(/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/]+={0,2})$/)
	const encoded = match?.[2]
	if (!encoded || encoded.length % 4 !== 0) return false

	const data = Buffer.from(encoded, 'base64')
	if (data.byteLength === 0 || data.byteLength > MAX_RASTER_BYTES) return false

	switch (match[1]) {
		case 'png':
			return data
				.subarray(0, 8)
				.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
		case 'jpeg':
			return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
		case 'webp':
			return (
				data.subarray(0, 4).toString('ascii') === 'RIFF' &&
				data.subarray(8, 12).toString('ascii') === 'WEBP'
			)
		default:
			return false
	}
}

/** Draft HTML에서 허용하는 내부 에셋 또는 제한된 raster data URI인지 판정한다. */
export function isSafeDraftTemplateAssetUrl(value: string): boolean {
	return (
		isCanonicalTemplateAssetUrl(value, [
			'template-assets',
			...AUTHORIZED_TEMPLATE_ASSET_COLLECTIONS,
		]) || isSafeRasterDataUrl(value)
	)
}

export { TEMPLATE_VECTOR_ASSET_COLLECTIONS }
