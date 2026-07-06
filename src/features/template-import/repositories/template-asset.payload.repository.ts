import config from '@payload-config'
import { Forbidden, getPayload } from 'payload'
import { AssetAccessDeniedError } from '@/lib/errors'

/**
 * 변환된 이미지 조각의 Payload 저장 경계.
 * user + overrideAccess: false로 호출해 컬렉션 access(manager/admin 쓰기)를 그대로 강제한다.
 */

/** Payload 접근 거부(Forbidden)를 도메인 에러로 번역한다 — 상위 계층은 payload 에러 타입을 모른다. */
function rethrowAccessDenied(error: unknown): never {
	if (error instanceof Forbidden) {
		throw new AssetAccessDeniedError()
	}
	throw error
}

/** 같은 내용(checksum)의 조각이 이미 있으면 돌려준다. 임포트 중복 생성 방지용. */
export async function findTemplateAssetByChecksum(
	user: unknown,
	checksum: string,
): Promise<{ id: number; url: string } | null> {
	const payload = await getPayload({ config })
	const assets = await payload
		.find({
			collection: 'template-assets',
			depth: 0,
			limit: 1,
			overrideAccess: false,
			user: user as never,
			where: {
				checksum: {
					equals: checksum,
				},
			},
		})
		.catch(rethrowAccessDenied)
	const asset = assets.docs[0]

	return asset?.url ? { id: asset.id, url: asset.url } : null
}

export async function createTemplateAsset(
	user: unknown,
	input: { data: Buffer; filename: string; mimeType: string; checksum: string },
): Promise<{ id: number; url: string }> {
	const payload = await getPayload({ config })
	const asset = await payload
		.create({
			collection: 'template-assets',
			data: {
				checksum: input.checksum,
			},
			file: {
				data: input.data,
				name: input.filename,
				mimetype: input.mimeType,
				size: input.data.byteLength,
			},
			overrideAccess: false,
			user: user as never,
		})
		.catch(rethrowAccessDenied)

	if (!asset.url) {
		throw new Error(`Template asset ${asset.id} has no URL.`)
	}

	return { id: asset.id, url: asset.url }
}
