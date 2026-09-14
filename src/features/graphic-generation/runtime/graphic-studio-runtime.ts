import type { GraphicRuntimeManifest } from '@/features/graphic-generation/domain/graphic-studio-config'
import { graphicStudioPlugins } from '@/features/graphic-generation/graphic-runtimes/catalog/model.generated'
import {
	createGraphicStudioPluginCatalog,
	type GraphicStudioPlugin,
} from '@/features/graphic-generation/runtime/graphic-plugin'
import type { VectorSceneArtifact } from '@/modules/studio-artifact/studio-artifact'
import type {
	ControllerGroupDefinition,
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import {
	acceptsControllerExecutionValues,
	applyControllerRestrictions,
} from '@/modules/studio-controller/controller-definition'

const graphicStudioPluginCatalog = createGraphicStudioPluginCatalog(graphicStudioPlugins)

type GraphicRuntimeId = keyof typeof graphicStudioPluginCatalog

/** 등록된 Graphic model만 파일 형식과 무관한 Vector Artifact로 투영한다. */
export function getGraphicStudioVectorArtifact(
	config: GraphicRuntimeManifest,
	values: ControllerValues,
	viewport: { width: number; height: number },
): VectorSceneArtifact | null {
	const plugin = getGraphicStudioPlugin(config)
	if (
		!plugin?.createVectorArtifact ||
		!acceptsControllerExecutionValues(config.controller.groups, values)
	) {
		return null
	}
	return plugin.createVectorArtifact(values, viewport)
}

/** 파일 형식 정책과 무관하게 Vector Artifact producer 존재 여부만 반환한다. */
export function hasGraphicStudioVectorArtifact(config: GraphicRuntimeManifest): boolean {
	return Boolean(getGraphicStudioPlugin(config)?.createVectorArtifact)
}

/** Graphic plugin이 의미를 아는 control에만 대상 기하 binding을 제공한다. */
export function getGraphicStudioRuntimeBindings(
	config: GraphicRuntimeManifest,
	viewport: { width: number; height: number },
): ControllerRuntimeBindings {
	return getGraphicStudioPlugin(config)?.getBindings?.(viewport) ?? {}
}

/**
 * 현재 값이 좁히는 만큼만 줄인 control 그룹을 낸다 — 값에 따라 선택지가 달라지는 축이 쓰는 유일한 길.
 * 좁힐 것이 없으면 **같은 배열 참조**를 그대로 돌려준다(useMemo 아래에서 재렌더를 만들지 않게).
 */
export function getGraphicStudioRuntimeGroups(
	config: GraphicRuntimeManifest,
	values: ControllerValues,
): readonly ControllerGroupDefinition[] {
	const restrictions = getGraphicStudioPlugin(config)?.getRestrictions?.(values) ?? null
	if (!restrictions) return config.controller.groups
	return applyControllerRestrictions(config.controller.groups, restrictions)
}

function getGraphicStudioPluginById(id: string): GraphicStudioPlugin | null {
	return graphicStudioPluginCatalog[id as GraphicRuntimeId] ?? null
}

function getGraphicStudioPlugin(config: GraphicRuntimeManifest): GraphicStudioPlugin | null {
	if (config.studio !== 'graphic') return null
	const plugin = getGraphicStudioPluginById(config.id)
	return plugin?.manifest.type === config.type ? plugin : null
}
