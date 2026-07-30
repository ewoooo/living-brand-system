import type { Payload, PayloadRequest } from 'payload'
import {
	deleteDraftImportedApplicationImage,
	publishDraftImportedApplicationImages,
	storeDraftImportedApplicationImage,
} from '@/features/application-image/repositories/imported-application-image.payload.repository'
import type { User } from '@/payload-types'

/**
 * 외부 import 결과를 ApplicationImage draft로 등록한다.
 * Payload upload/storage I/O와 중복 제거는 application-image repository가 소유한다.
 */
export async function stageImportedApplicationImage(
	payload: Payload,
	user: User,
	input: { data: Buffer; filename: string; mimeType: string; name: string },
) {
	return storeDraftImportedApplicationImage(payload, user, input)
}

/**
 * 실패한 import가 이번 요청에서 만든 ApplicationImage draft를 정리한다.
 * Payload 삭제 I/O는 application-image repository가 소유한다.
 */
export async function discardImportedApplicationImage(payload: Payload, user: User, id: number) {
	return deleteDraftImportedApplicationImage(payload, user, id)
}

/**
 * Template 발행이 참조한 import draft를 같은 요청 트랜잭션에서 발행한다.
 * Payload 조회·상태 변경 I/O는 application-image repository가 소유한다.
 */
export async function publishImportedApplicationImages(
	req: PayloadRequest,
	assetIds: readonly number[],
) {
	return publishDraftImportedApplicationImages(req, assetIds)
}
