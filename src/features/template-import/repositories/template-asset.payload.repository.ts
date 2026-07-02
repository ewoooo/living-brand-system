import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * 변환된 이미지 조각의 Payload 저장 경계.
 * user + overrideAccess: false로 호출해 컬렉션 access(manager/admin 쓰기)를 그대로 강제한다.
 */
export async function createTemplateAsset(
	user: unknown,
	input: { data: Buffer; filename: string; mimeType: string },
): Promise<{ id: number; url: string }> {
	const payload = await getPayload({ config })
	const asset = await payload.create({
		collection: 'template-assets',
		data: {},
		file: {
			data: input.data,
			name: input.filename,
			mimetype: input.mimeType,
			size: input.data.byteLength,
		},
		overrideAccess: false,
		user: user as never,
	})

	if (!asset.url) {
		throw new Error(`Template asset ${asset.id} has no URL.`)
	}

	return { id: asset.id, url: asset.url }
}
