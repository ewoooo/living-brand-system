import {
	canRenderGraphicStudioSvg,
	deriveGraphicStudioConfig,
	graphicStudioConfigs,
} from '@/features/graphic-studio/graphic-studio-runtime'
import { listPublishedGraphicProfileDefinitions } from '@/features/graphic-studio/repositories/graphic-profile.payload.repository'

/**
 * 유스케이스 경계: published Graphic Profile을 runtime 기본값보다 좁은 Studio Config 목록으로 만든다.
 * Payload 조회 I/O는 repository가 소유하고, Template 소비자는 SVG adapter가 있는 Config만 요청한다.
 */
export async function listGraphicStudioConfigs(
	user: unknown,
	{ svgOnly = false }: { svgOnly?: boolean } = {},
) {
	const profiles = await listPublishedGraphicProfileDefinitions(user)
	const configured = profiles.map(deriveGraphicStudioConfig)
	const configuredIds = new Set(configured.map((config) => config.id))
	const configs = [
		...configured,
		...graphicStudioConfigs.filter((config) => !configuredIds.has(config.id)),
	]
	return svgOnly ? configs.filter(canRenderGraphicStudioSvg) : configs
}
