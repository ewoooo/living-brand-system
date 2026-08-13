import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { graphicStudioPlugins } from '@/features/graphic-generation/graphic-runtimes/catalog/model.generated'
import {
	createGraphicStudioPluginCatalog,
	type GraphicStudioPlugin,
} from '@/features/graphic-generation/runtime/graphic-plugin'
import type { VectorSceneArtifact } from '@/modules/studio-artifact/studio-artifact'
import type {
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import { acceptsControllerExecutionValues } from '@/modules/studio-controller/controller-definition'

const graphicStudioPluginCatalog = createGraphicStudioPluginCatalog(graphicStudioPlugins)

type GraphicRuntimeId = keyof typeof graphicStudioPluginCatalog

/** 등록된 Graphic model만 파일 형식과 무관한 Vector Artifact로 투영한다. */
export function getGraphicStudioVectorArtifact(
	config: GraphicStudioConfig,
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
export function hasGraphicStudioVectorArtifact(config: GraphicStudioConfig): boolean {
	return Boolean(getGraphicStudioPlugin(config)?.createVectorArtifact)
}

/** Graphic plugin이 의미를 아는 control에만 대상 기하 binding을 제공한다. */
export function getGraphicStudioRuntimeBindings(
	config: GraphicStudioConfig,
	viewport: { width: number; height: number },
): ControllerRuntimeBindings {
	return getGraphicStudioPlugin(config)?.getBindings?.(viewport) ?? {}
}

function getGraphicStudioPluginById(id: string): GraphicStudioPlugin | null {
	return graphicStudioPluginCatalog[id as GraphicRuntimeId] ?? null
}

function getGraphicStudioPlugin(config: GraphicStudioConfig): GraphicStudioPlugin | null {
	if (config.studio !== 'graphic') return null
	const plugin = getGraphicStudioPluginById(config.id)
	return plugin?.manifest.type === config.type ? plugin : null
}
