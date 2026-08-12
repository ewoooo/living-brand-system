import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import {
	createGraphicStudioPluginCatalog,
	type GraphicStudioPlugin,
} from '@/features/graphic-generation/runtime/graphic-plugin'
import { forwardStraightGraphicPlugin } from '@/features/graphic-generation/runtime/plugins/forward-straight'
import { radialFlutedGlassGraphicPlugin } from '@/features/graphic-generation/runtime/plugins/radial-fluted-glass'
import { supportsStudioOutput } from '@/features/studio-export/studio-output'
import type {
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import { acceptsControllerExecutionValues } from '@/modules/studio-controller/controller-definition'

const graphicStudioPlugins = [forwardStraightGraphicPlugin, radialFlutedGlassGraphicPlugin] as const
const graphicStudioPluginCatalog = createGraphicStudioPluginCatalog(graphicStudioPlugins)

type GraphicRuntimeId = keyof typeof graphicStudioPluginCatalog

/** 등록된 Graphic plugin만 순수 SVG로 투영한다. */
export function renderGraphicStudioSvg(
	config: GraphicStudioConfig,
	values: ControllerValues,
	viewport: { width: number; height: number },
): string | null {
	const plugin = getGraphicStudioPlugin(config)
	if (
		!plugin?.renderSvg ||
		!supportsStudioOutput(config.output, 'svg') ||
		!acceptsControllerExecutionValues(config.controller.groups, values)
	) {
		return null
	}
	return plugin.renderSvg(values, viewport)
}

/** SVG adapter가 준비된 Graphic Config만 Template 합성 경로에 허용한다. */
export function canRenderGraphicStudioSvg(config: GraphicStudioConfig): boolean {
	return (
		supportsStudioOutput(config.output, 'svg') &&
		Boolean(getGraphicStudioPlugin(config)?.renderSvg)
	)
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
