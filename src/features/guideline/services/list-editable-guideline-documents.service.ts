import type { PayloadRequest } from 'payload'
import { listEditableGuidelineDocuments as listEditableGuidelineDocumentRecords } from '../repositories/guideline-document.payload.repository'

/**
 * Payload Admin 문서 트리에 편집 가능한 Guideline 문서 목록을 제공한다.
 * 접근 제어가 적용된 조회와 Payload 변환 I/O는 guideline-document repository가 소유한다.
 */
export async function listEditableGuidelineDocuments(
	payload: PayloadRequest['payload'],
	input: {
		locale?: 'en' | 'ko'
		user: Parameters<PayloadRequest['payload']['find']>[0]['user']
	},
) {
	return listEditableGuidelineDocumentRecords(payload, input)
}
