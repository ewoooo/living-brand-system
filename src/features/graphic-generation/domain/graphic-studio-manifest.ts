import {
	type GraphicRuntimeManifest,
	type GraphicStudioConfig,
	parseGraphicStudioConfig,
} from '@/features/graphic-generation/domain/graphic-studio-config'
import { graphicRuntimeManifests } from '@/features/graphic-generation/graphic-runtimes/catalog/manifest.generated'
import type { StudioOutputCapability } from '@/features/studio-export/studio-output'
import { resolveStudioArtifactOutputFormats } from '@/features/studio-export/studio-output'
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

/** Graphic Artifact와 Admin 정책을 Export Layer가 소비할 effective capability로 투영한다. */
export function resolveGraphicStudioOutput(
	manifest: GraphicRuntimeManifest,
	allowedFormats?: readonly string[] | null,
): StudioOutputCapability {
	return {
		formats: resolveStudioArtifactOutputFormats(manifest.artifacts, allowedFormats),
		colorProfiles: { rgb: ['srgb'], cmyk: ['cgats21-crpc6'] },
		...(manifest.artifacts.includes('video')
			? {
					video: {
						mp4: {
							codec: 'h264' as const,
							colorSpace: 'rec709' as const,
							fps: [24, 30, 60] as const,
							maxWidth: 1920,
							maxHeight: 1080,
							maxDurationSeconds: 10,
						},
					},
				}
			: {}),
	}
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
		output: resolveGraphicStudioOutput(manifest, profile.exportPolicy?.allowedFormats),
		controller: {
			groups: applyControllerRestrictions(manifest.controller.groups, restrictions),
		},
	}
	parseGraphicStudioConfig(config)
	return config
}
