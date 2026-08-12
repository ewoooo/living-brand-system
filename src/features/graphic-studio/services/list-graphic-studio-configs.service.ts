import {
	deriveGraphicStudioConfig,
	graphicStudioConfigs,
} from '@/features/graphic-studio/graphic-studio-runtime'
import { listPublishedGraphicProfileDefinitions } from '@/features/graphic-studio/repositories/graphic-profile.payload.repository'

/**
 * 유스케이스 경계: published Graphic Profile을 runtime 기본값보다 좁은 Studio Config 목록으로 만든다.
 * Payload 조회 I/O는 graphic-profile repository가 소유하고, 등록 runtime이 없는 기존 DB는 코드 기본값을 쓴다.
 */
export async function listGraphicStudioConfigs(user: unknown) {
	const profiles = await listPublishedGraphicProfileDefinitions(user)
	const configured = profiles.map(deriveGraphicStudioConfig)
	const configuredIds = new Set(configured.map((config) => config.id))
	return [
		...configured,
		...graphicStudioConfigs.filter((config) => !configuredIds.has(config.id)),
	]
}
