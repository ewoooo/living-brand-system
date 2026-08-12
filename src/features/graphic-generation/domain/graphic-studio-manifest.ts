import {
	type GraphicStudioConfig,
	parseGraphicStudioConfig,
} from '@/features/graphic-generation/domain/graphic-studio-config'
import { forwardStraightGraphicConfig } from '@/features/graphic-generation/domain/manifests/forward-straight'
import { radialFlutedGlassGraphicConfig } from '@/features/graphic-generation/domain/manifests/radial-fluted-glass'
import { resolveStudioOutputFormats } from '@/features/studio-export/studio-output'
import {
	applyControllerOverride,
	projectPayloadControllerOverride,
} from '@/modules/studio-controller/controller-definition'
import type { PublishedGraphicProfileDefinition } from './graphic-studio-config'

export { forwardStraightGraphicConfig, radialFlutedGlassGraphicConfig }

export const graphicStudioConfigs = [
	forwardStraightGraphicConfig,
	radialFlutedGlassGraphicConfig,
] as const satisfies readonly GraphicStudioConfig[]

export type GraphicRuntimeId = (typeof graphicStudioConfigs)[number]['id']

export const GRAPHIC_RUNTIME_OPTIONS = graphicStudioConfigs.map((manifest) => ({
	value: manifest.id,
	label: manifest.name,
}))

/** Admin과 published projector가 읽는 서버 안전 Graphic Manifest를 찾는다. */
export function getGraphicStudioManifest(id: string): GraphicStudioConfig | null {
	return graphicStudioConfigs.find((manifest) => manifest.id === id) ?? null
}

/** published Graphic Profile을 Manifest 기본 계약보다 좁은 Effective Config로 투영한다. */
export function deriveGraphicStudioConfig(
	profile: PublishedGraphicProfileDefinition,
): GraphicStudioConfig {
	const manifest = getGraphicStudioManifest(profile.runtime)
	if (!manifest) throw new Error(`등록되지 않은 Graphic runtime입니다: ${profile.runtime}`)
	const override = projectPayloadControllerOverride(
		profile.controllerOverride ?? profile.controller,
	)
	const config: GraphicStudioConfig = {
		...manifest,
		name: profile.name,
		output: {
			...manifest.output,
			formats: resolveStudioOutputFormats(
				manifest.output.formats,
				profile.output?.allowedFormats,
			),
		},
		controller: {
			groups: applyControllerOverride(manifest.controller.groups, override),
		},
	}
	parseGraphicStudioConfig(config)
	return config
}
