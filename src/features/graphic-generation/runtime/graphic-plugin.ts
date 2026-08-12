import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { parseGraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type {
	ControllerRuntimeBindings,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'

export type GraphicViewport = { width: number; height: number }

/** Graphic 하나가 Catalog에 제공하는 직렬화 가능한 Manifest와 순수 runtime adapter 계약. */
export type GraphicStudioPlugin<Id extends string = string> = {
	manifest: GraphicStudioConfig & { id: Id }
	renderSvg?: (values: ControllerValues, viewport: GraphicViewport) => string
	getBindings?: (viewport: GraphicViewport) => ControllerRuntimeBindings
}

/** 코드로 등록하는 Graphic Manifest를 공통 Config 경계에서 즉시 검증한다. */
export function defineGraphicStudioPlugin<const Id extends string>(
	plugin: GraphicStudioPlugin<Id>,
): GraphicStudioPlugin<Id> {
	parseGraphicStudioConfig(plugin.manifest)
	if (plugin.manifest.output.formats.includes('svg') && !plugin.renderSvg) {
		throw new Error(`${plugin.manifest.id}: SVG output adapter가 필요합니다.`)
	}
	return plugin
}

/** 등록 key와 Manifest ID가 다른 Plugin을 거부하고 조회 전용 Catalog를 만든다. */
export function createGraphicStudioPluginCatalog<
	const Plugins extends Readonly<Record<string, GraphicStudioPlugin>>,
>(plugins: Plugins): Plugins {
	const catalog: Record<string, GraphicStudioPlugin> = Object.create(null)
	for (const [id, plugin] of Object.entries(plugins)) {
		if (plugin.manifest.id !== id) {
			throw new Error(`Graphic plugin key와 Manifest ID가 다릅니다: ${id}`)
		}
		catalog[id] = plugin
	}
	return Object.freeze(catalog) as Plugins
}
