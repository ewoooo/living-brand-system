import { listPublishedImageProfiles } from '@/features/image-generation/repositories/image-profile.payload.repository'

/**
 * 유스케이스 경계: 표면(Studio·Agent·MCP)이 선택할 수 있는 published 이미지 프로파일을 조회한다.
 * Payload 조회 I/O는 image-profile repository가 소유한다.
 */
export function listAvailableImageProfiles(user: unknown) {
	return listPublishedImageProfiles(user)
}
