import type { Payload } from 'payload'
import type { AUTHORIZED_ASSET_COLLECTIONS } from '@/types/json-template'

/**
 * 인가 에셋 컬렉션(브랜드 로고 등)의 Payload 조회 경계.
 * collection hook에서 호출되므로 @payload-config를 import하지 않고
 * 호출자의 payload 인스턴스를 받는다 (payload.config와의 순환 의존 방지).
 */
export async function findAuthorizedAssetsByIds(
	payload: Payload,
	collection: (typeof AUTHORIZED_ASSET_COLLECTIONS)[number],
	assetIds: number[],
): Promise<Map<number, { url?: string | null }>> {
	const found = await payload.find({
		collection,
		depth: 0,
		limit: assetIds.length,
		overrideAccess: true,
		where: { id: { in: assetIds } },
	})

	return new Map(
		(found.docs as { id: number; url?: string | null }[]).map((doc) => [doc.id, doc]),
	)
}
