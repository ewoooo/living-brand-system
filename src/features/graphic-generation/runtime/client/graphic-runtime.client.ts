'use client'

import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type { GraphicRuntimeId } from '@/features/graphic-generation/graphic-runtimes/catalog/manifest.generated'
import { graphicRuntimeCatalog } from '@/features/graphic-generation/graphic-runtimes/catalog/runtime.generated.client'
import type {
	ControllerControlValue,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'

export type GraphicRuntime = {
	update(values: ControllerValues): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	captureFrame(): string
	video?: {
		canvas: HTMLCanvasElement
		renderFrame(timeSeconds: number, width: number, height: number): void
		restore(): void
	}
	destroy(): void
}

export type GraphicRuntimeAdapter = {
	type: GraphicStudioConfig['type']
	mount(options: {
		container: HTMLElement
		values: ControllerValues
		onChange: (controlId: string, value: ControllerControlValue) => boolean
	}): Promise<GraphicRuntime>
}

/** Config id와 runtime type이 모두 일치하는 브라우저 runtime adapter만 반환한다. */
export function getGraphicRuntimeAdapter(
	config: GraphicStudioConfig,
): GraphicRuntimeAdapter | null {
	const adapter = graphicRuntimeCatalog[config.id as GraphicRuntimeId]
	return adapter?.type === config.type ? adapter : null
}
