import type { PayloadRequest } from 'payload'
import type { AuthorizedAssetCollection } from '@/services/inspect-template-html.service'

/**
 * 인가 에셋 컬렉션(브랜드 로고 등)의 Payload 조회 경계.
 * collection hook에서 호출되므로 @payload-config를 import하지 않고
 * 호출자의 req를 받아 같은 트랜잭션을 유지한다 (payload.config와의 순환 의존 방지).
 */
export async function findAuthorizedAssetsByIds(
	req: PayloadRequest,
	collection: AuthorizedAssetCollection,
	assetIds: number[],
): Promise<Map<number, { url?: string | null }>> {
	const found = await req.payload.find({
		collection,
		depth: 0,
		draft: false,
		limit: assetIds.length,
		// 저장 게이트의 서버 내부 무결성 검증이다. 발행본의 id/url만 읽으므로
		// 요청 사용자 기준 access 재평가를 생략한다.
		overrideAccess: true,
		req,
		where: {
			and: [{ id: { in: assetIds } }, { _status: { equals: 'published' } }],
		},
	})

	return new Map(
		(found.docs as { id: number; url?: string | null }[]).map((doc) => [doc.id, doc]),
	)
}
