import type { Payload } from 'payload'
import { AUTHORIZED_ASSET_COLLECTIONS } from '@/types/json-template'
import { findAuthorizedAssetsByIds } from '../repositories/authorized-asset.payload.repository'
import {
	type AuthorizedImageRef,
	validateTemplateImages,
} from '../utils/validate-authorized-assets'

/**
 * Templates 발행 게이트 Use Case — published 전이 시 jsonTemplate이 스키마와 인가 에셋 규칙을
 * 지키는지 판정해 차단 메시지를 돌려준다. 훅이 결과를 HTTP 오류로 바꾸고,
 * Payload 조회는 authorized-asset.payload.repository가 소유한다.
 */
export async function findTemplatePublishBlocker(
	payload: Payload,
	jsonTemplate: unknown,
): Promise<string | null> {
	const validation = validateTemplateImages(jsonTemplate)

	// 보안 게이트는 fail-closed — 검사할 수 없는 값은 저장하지 않는다.
	if (validation.status === 'invalid') {
		return 'jsonTemplate이 스키마(src/types/json-template.ts)와 맞지 않아 저장할 수 없습니다.'
	}
	if (validation.unauthorizedLabels.length > 0) {
		return `인가된 에셋으로 교체되지 않은 이미지가 있습니다: ${validation.unauthorizedLabels.join(', ')}. 미리보기에서 각 이미지를 브랜드 에셋으로 교체한 뒤 저장하세요.`
	}

	// 인가 컬렉션은 자기신고 라벨이 아니라 실제 문서 참조로 검증한다.
	const invalidRefLabels = await findInvalidAuthorizedRefs(payload, validation.authorizedRefs)
	if (invalidRefLabels.length > 0) {
		return `인가 에셋 참조가 유효하지 않습니다: ${invalidRefLabels.join(', ')}. 미리보기에서 에셋을 다시 선택하세요.`
	}

	return null
}

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
