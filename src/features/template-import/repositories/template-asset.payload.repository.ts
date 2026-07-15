import type { Payload } from 'payload'
import type { User } from '@/payload-types'

export interface StoredTemplateAsset {
	id: number
	url: string
}

/**
 * 임포트 SVG를 Template Assets에 중복 없이 저장하는 경계다.
 * Payload upload/S3 I/O는 이 repository가 소유하고, 호출 서비스는 Figma 변환 순서만 조율한다.
 */
export async function storeTemplateAsset(
	payload: Payload,
	user: User,
	input: { checksum: string; data: Buffer; filename: string; mimeType: string },
): Promise<StoredTemplateAsset & { created: boolean }> {
	const found = await payload.find({
		collection: 'template-assets',
		depth: 0,
		limit: 1,
		overrideAccess: false,
		user,
		where: { checksum: { equals: input.checksum } },
	})
	const existing = found.docs[0]

	if (existing?.url) {
		return { id: existing.id, url: existing.url, created: false }
	}

	const created = await payload.create({
		collection: 'template-assets',
		data: { checksum: input.checksum },
		file: {
			data: input.data,
			mimetype: input.mimeType,
			name: input.filename,
			size: input.data.byteLength,
		},
		overrideAccess: false,
		user,
	})

	if (!created.url) {
		await payload.delete({
			collection: 'template-assets',
			id: created.id,
			overrideAccess: false,
			user,
		})
		throw new Error('Stored template asset has no URL.')
	}

	return { id: created.id, url: created.url, created: true }
}

/** 이번 임포트가 실패했을 때 그 요청이 새로 만든 임시 에셋만 제거한다. 외부 저장소 삭제는 Payload upload adapter가 소유한다. */
export async function deleteTemplateAsset(payload: Payload, user: User, id: number): Promise<void> {
	await payload.delete({
		collection: 'template-assets',
		id,
		overrideAccess: false,
		user,
	})
}
