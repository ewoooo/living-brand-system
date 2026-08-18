import {
	type GraphicRuntimeManifest,
	type GraphicStudioConfig,
	parseGraphicStudioConfig,
} from '@/features/graphic-generation/domain/graphic-studio-config'
import { graphicRuntimeManifests } from '@/features/graphic-generation/graphic-runtimes/catalog/manifest.generated'
import {
	projectStudioOutputPolicy,
	resolveStudioOutputCapability,
	type StudioOutputCapability,
} from '@/features/studio-export/studio-output'
import {
	applyControllerRestrictions,
	projectPayloadControllerRestrictions,
	resolveControllerPresentation,
	toStudioPreviewImage,
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

/** Graphic Artifact와 Admin 정책을 Export Layer가 소비할 effective capability로 투영한다. */
export function resolveGraphicStudioOutput(
	manifest: GraphicRuntimeManifest,
	policy?: unknown,
): StudioOutputCapability {
	return resolveStudioOutputCapability(manifest.artifacts, projectStudioOutputPolicy(policy))
}

/** published Graphic Profile을 Manifest 기본 계약보다 좁은 Effective Config로 투영한다. */
export function deriveGraphicStudioConfig(
	profile: PublishedGraphicProfileDefinition,
): GraphicStudioConfig {
	const manifest = getGraphicRuntimeManifest(profile.runtime)
	if (!manifest) throw new Error(`등록되지 않은 Graphic runtime입니다: ${profile.runtime}`)
	const restrictions = projectPayloadControllerRestrictions(profile.controllerRestrictions)
	const groups = applyControllerRestrictions(manifest.controller.groups, restrictions)
	const config: GraphicStudioConfig = {
		...manifest,
		name: profile.name,
		output: resolveGraphicStudioOutput(manifest, profile.exportPolicy),
		controller: {
			groups,
		},
		controllerPresentation: resolveControllerPresentation(
			groups,
			profile.controllerPresentation,
		),
		previewImage: toStudioPreviewImage(profile.previewImage),
	}
	parseGraphicStudioConfig(config)
	return config
}
