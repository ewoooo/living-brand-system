import type { PayloadRequest } from 'payload'
import { hasGuidelineDocumentSlugConflict as queryGuidelineDocumentSlugConflict } from '../repositories/guideline-document.payload.repository'

/**
 * Guideline 저장 전에 같은 locale·부모 아래의 slug 충돌 여부를 확인한다.
 * 중복 문서 조회와 Payload 변환 I/O는 guideline-document repository가 소유한다.
 */
export async function hasGuidelineDocumentSlugConflict(
	req: PayloadRequest,
	input: {
		currentId: number | null
		parentId: number | null
		slug: string
	},
) {
	return queryGuidelineDocumentSlugConflict(req, input)
}
