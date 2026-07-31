import type { Payload, PayloadRequest } from 'payload'
import type { User } from '@/payload-types'

export interface StoredImportedApplicationImage {
	collection: 'application-images'
	id: number
	url: string
}

/**
 * 외부 import 결과를 공개 승인 전 Application Images draft로 저장한다.
 * Payload upload/storage I/O와 filename 기반 중복 제거는 이 repository가 소유한다.
 */
export async function storeDraftImportedApplicationImage(
	payload: Payload,
	user: User,
	input: { data: Buffer; filename: string; mimeType: string; name: string },
): Promise<StoredImportedApplicationImage & { created: boolean }> {
	const found = await payload.find({
		collection: 'application-images',
		depth: 0,
		draft: true,
		limit: 1,
		overrideAccess: false,
		user,
		where: { filename: { equals: input.filename } },
	})
	const existing = found.docs[0]

	if (existing?.url) {
		return {
			collection: 'application-images',
			id: existing.id,
			url: existing.url,
			created: false,
		}
	}

	const created = await payload.create({
		collection: 'application-images',
		data: { name: input.name, alt: input.name, _status: 'draft' },
		draft: true,
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
			collection: 'application-images',
			id: created.id,
			overrideAccess: false,
			user,
		})
		throw new Error('Stored Figma asset has no URL.')
	}

	return {
		collection: 'application-images',
		id: created.id,
		url: created.url,
		created: true,
	}
}

/** 실패한 임포트가 이번 요청에서 만든 Application Images draft만 제거한다. 파일 삭제는 upload adapter가 소유한다. */
export async function deleteDraftImportedApplicationImage(
	payload: Payload,
	user: User,
	id: number,
): Promise<void> {
	await payload.delete({
		collection: 'application-images',
		id,
		overrideAccess: false,
		user,
	})
}

/**
 * Template 발행이 참조한 import draft만 같은 트랜잭션에서 published로 승격한다.
 * 실제 Application Images 쓰기는 Payload Local API가 소유한다.
 */
export async function publishDraftImportedApplicationImages(
	req: PayloadRequest,
	assetIds: readonly number[],
): Promise<void> {
	const uniqueIds = [...new Set(assetIds)]
	if (uniqueIds.length === 0) return

	const found = await req.payload.find({
		collection: 'application-images',
		depth: 0,
		draft: true,
		limit: uniqueIds.length,
		overrideAccess: true,
		req,
		where: { id: { in: uniqueIds } },
	})

	for (const asset of found.docs) {
		if (asset._status !== 'draft') continue
		await req.payload.update({
			collection: 'application-images',
			id: asset.id,
			data: { _status: 'published' },
			overrideAccess: true,
			req,
		})
	}
}
