import type { PayloadRequest } from 'payload'
import {
	listEditableGuidelineDocuments as listEditableGuidelineDocumentRecords,
	listGuidelineChapterOptions,
} from '../repositories/guideline-document.payload.repository'

/**
 * Payload Admin 목록에 편집 가능한 토픽과 그것을 묶을 챕터를 함께 제공한다.
 * 접근 제어가 적용된 조회와 Payload 변환 I/O는 guideline-document repository가 소유한다.
 */
export async function listEditableGuidelineDocuments(
	payload: PayloadRequest['payload'],
	input: {
		locale?: 'en' | 'ko'
		user: Parameters<PayloadRequest['payload']['find']>[0]['user']
	},
) {
	const [topics, chapters] = await Promise.all([
		listEditableGuidelineDocumentRecords(payload, input),
		listGuidelineChapterOptions(payload, input),
	])

	return { topics, chapters }
}
