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
			/**
			 * 🔴 재조립하면서 빠뜨리면 선언이 통째로 사라진다 — `basic`을 빠뜨리면 감춘 컨트롤이
			 *    전부 창작자 화면에 뜨고, `remountOn`을 빠뜨리면 모양을 바꿔도 캔버스가 옛
			 *    프로그램으로 남는다. 미선언 런타임의 `undefined`를 그대로 실으면 JSON 직렬화
			 *    검사가 프로파일을 거부하므로 키 자체를 빼야 한다.
			 *
			 * 제한과 함께 좁힐 필요는 없다 — `applyControllerRestrictions`는 컨트롤을 1:1로 옮기고
			 * 없애지 않으므로(`availability`는 readonly·disabled뿐이다) 고아 id가 생기지 않는다.
			 */
			...(manifest.controller.basic ? { basic: manifest.controller.basic } : {}),
			...(manifest.controller.remountOn ? { remountOn: manifest.controller.remountOn } : {}),
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
