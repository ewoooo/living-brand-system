import type { Payload } from 'payload'
import { AUTHORIZED_ASSET_COLLECTIONS } from '@/types/json-template'
import { findAuthorizedAssetsByIds } from '../repositories/authorized-asset.payload.repository'
import type { AuthorizedImageRef } from '../utils/validate-authorized-assets'

/**
 * Templates 저장 게이트 Use Case — 자기신고된 인가 에셋 참조가 실제 문서를 가리키고
 * src도 그 문서의 URL인지 검증한다. Payload 조회는 authorized-asset.payload.repository가 소유한다.
 */
export async function findInvalidAuthorizedRefs(
	payload: Payload,
	refs: AuthorizedImageRef[],
): Promise<string[]> {
	const invalidLabels: string[] = []

	for (const collection of AUTHORIZED_ASSET_COLLECTIONS) {
		const collectionRefs = refs.filter((ref) => ref.collection === collection)

		if (collectionRefs.length === 0) {
			continue
		}

		const docsById = await findAuthorizedAssetsByIds(
			payload,
			collection,
			collectionRefs.map((ref) => ref.assetId),
		)

		for (const ref of collectionRefs) {
			const doc = docsById.get(ref.assetId)
			const srcMatches =
				doc != null && (ref.src === doc.url || ref.src.startsWith(`/api/${collection}/`))

			if (!srcMatches) {
				invalidLabels.push(ref.label)
			}
		}
	}

	return invalidLabels
}
