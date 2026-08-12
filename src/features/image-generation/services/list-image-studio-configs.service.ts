import {
	deriveImageStudioConfig,
	type ImageStudioConfig,
} from '@/features/image-generation/domain/image-studio-config'
import { listPublishedImageProfileDefinitions } from '@/features/image-generation/repositories/image-studio-profile.payload.repository'

/**
 * 유스케이스 경계: 스튜디오 이미지 화면이 고를 수 있는 published 프로파일의 편집 계약 목록을 만든다.
 * Payload 조회 I/O는 image-profile repository가 소유하고, 계약 파생은 순수 함수가 소유한다.
 * 프로파일 교체가 네트워크 없이 즉시 반영되도록 목록을 한 번에 내린다.
 */
export async function listImageStudioConfigs(user: unknown): Promise<ImageStudioConfig[]> {
	const profiles = await listPublishedImageProfileDefinitions(user)
	return profiles.map(deriveImageStudioConfig)
}
