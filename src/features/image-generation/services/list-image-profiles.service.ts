import { listPublishedImageProfiles } from '@/features/image-generation/repositories/image-profile.payload.repository'

/** Creator와 Agent에 사용 가능한 published 이미지 프로파일 선택지를 제공한다. Payload 조회는 repository가 소유한다. */
export async function listAvailableImageProfiles(user: unknown) {
	return listPublishedImageProfiles(user)
}
