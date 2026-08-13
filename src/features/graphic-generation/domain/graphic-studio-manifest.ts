import {
	type GraphicRuntimeManifest,
	type GraphicStudioConfig,
	parseGraphicStudioConfig,
} from '@/features/graphic-generation/domain/graphic-studio-config'
import { graphicRuntimeManifests } from '@/features/graphic-generation/graphic-runtimes/catalog/manifest.generated'
import { resolveStudioOutputFormats } from '@/features/studio-export/studio-output'
import {
	applyControllerRestrictions,
	projectPayloadControllerRestrictions,
} from '@/modules/studio-controller/controller-definition'
import type { PublishedGraphicProfileDefinition } from './graphic-studio-config'

export { graphicRuntimeManifests }

export type GraphicRuntimeId = (typeof graphicRuntimeManifests)[number]['id']

export const GRAPHIC_RUNTIME_OPTIONS = graphicRuntimeManifests.map((manifest) => ({
	value: manifest.id,
	label: manifest.name,
}))

/** Admin과 published projector가 읽는 서버 안전 Graphic Manifest를 찾는다. */
export function getGraphicRuntimeManifest(id: string): GraphicRuntimeManifest | null {
	return graphicRuntimeManifests.find((manifest) => manifest.id === id) ?? null
}

/** published Graphic Profile을 Manifest 기본 계약보다 좁은 Effective Config로 투영한다. */
export function deriveGraphicStudioConfig(
	profile: PublishedGraphicProfileDefinition,
): GraphicStudioConfig {
	const manifest = getGraphicRuntimeManifest(profile.runtime)
	if (!manifest) throw new Error(`등록되지 않은 Graphic runtime입니다: ${profile.runtime}`)
	const restrictions = projectPayloadControllerRestrictions(profile.controllerRestrictions)
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
			groups: applyControllerRestrictions(manifest.controller.groups, restrictions),
		},
	}
	parseGraphicStudioConfig(config)
	return config
}
