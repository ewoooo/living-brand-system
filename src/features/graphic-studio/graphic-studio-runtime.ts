import {
	createGraphicStudioPluginCatalog,
	type GraphicStudioPlugin,
} from '@/features/graphic-studio/graphic-plugin'
import type { GraphicStudioConfig } from '@/features/graphic-studio/graphic-studio-config'
import {
	type PublishedGraphicProfileDefinition,
	parseGraphicStudioConfig,
} from '@/features/graphic-studio/graphic-studio-config'
import { forwardStraightGraphicPlugin } from '@/features/graphic-studio/graphics/forward-straight'
import { radialFlutedGlassGraphicPlugin } from '@/features/graphic-studio/graphics/radial-fluted-glass'
import type {
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/features/studio-controller/controller-definition'
import {
	acceptsControllerExecutionValues,
	applyControllerOverride,
	projectPayloadControllerOverride,
} from '@/features/studio-controller/controller-definition'
import {
	resolveStudioOutputFormats,
	supportsStudioOutput,
} from '@/features/studio-export/studio-output'

const graphicStudioPlugins = [forwardStraightGraphicPlugin, radialFlutedGlassGraphicPlugin] as const
const graphicStudioPluginCatalog = createGraphicStudioPluginCatalog(graphicStudioPlugins)

export type GraphicRuntimeId = keyof typeof graphicStudioPluginCatalog

export const forwardStraightGraphicConfig = forwardStraightGraphicPlugin.manifest
export const radialFlutedGlassGraphicConfig = radialFlutedGlassGraphicPlugin.manifest

export const graphicStudioConfigs: readonly GraphicStudioConfig[] = graphicStudioPlugins.map(
	(plugin) => plugin.manifest,
)

export const GRAPHIC_RUNTIME_OPTIONS = graphicStudioPlugins.map((plugin) => ({
	value: plugin.manifest.id,
	label: plugin.manifest.name,
}))

/** published Graphic Profile을 등록된 Manifest의 기본 계약보다 좁은 Config로 투영한다. */
export function deriveGraphicStudioConfig(
	profile: PublishedGraphicProfileDefinition,
): GraphicStudioConfig {
	const plugin = getGraphicStudioPluginById(profile.runtime)
	if (!plugin) throw new Error(`등록되지 않은 Graphic runtime입니다: ${profile.runtime}`)
	const override = projectPayloadControllerOverride(
		profile.controllerOverride ?? profile.controller,
	)
	const config: GraphicStudioConfig = {
		...plugin.manifest,
		name: profile.name,
		output: {
			formats: resolveStudioOutputFormats(
				plugin.manifest.output.formats,
				profile.output?.allowedFormats,
			),
		},
		controller: {
			groups: applyControllerOverride(plugin.manifest.controller.groups, override),
		},
	}
	parseGraphicStudioConfig(config)
	return config
}

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
