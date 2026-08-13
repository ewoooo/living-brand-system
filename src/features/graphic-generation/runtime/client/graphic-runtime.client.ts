'use client'

import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type { GraphicRuntimeId } from '@/features/graphic-generation/graphic-runtimes/catalog/manifest.generated'
import { graphicRuntimeCatalog } from '@/features/graphic-generation/graphic-runtimes/catalog/runtime.generated.client'
import type {
	CanvasRasterSource,
	CanvasVideoSource,
	RasterArtifact,
	VideoArtifact,
} from '@/modules/studio-artifact/studio-artifact'
import type {
	ControllerControlValue,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'

export type GraphicRuntime = {
	update(values: ControllerValues): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	artifacts: {
		raster: RasterArtifact<CanvasRasterSource>
		video?: VideoArtifact<CanvasVideoSource>
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

/** Canvas 정적 렌더를 Raster Artifact로 노출하고 export 뒤 현재 preview 크기를 복원한다. */
export function createGraphicRasterArtifact({
	canvas,
	getViewport,
	render,
}: {
	canvas: HTMLCanvasElement
	getViewport: () => { width: number; height: number }
	render: (width: number, height: number) => void
}): RasterArtifact<CanvasRasterSource> {
	return {
		kind: 'raster',
		source: {
			canvas,
			render,
			restore: () => {
				const { width, height } = getViewport()
				render(width, height)
			},
		},
	}
}

/** Config id와 runtime type이 모두 일치하는 브라우저 runtime adapter만 반환한다. */
export function getGraphicRuntimeAdapter(
	config: GraphicStudioConfig,
): GraphicRuntimeAdapter | null {
	const adapter = graphicRuntimeCatalog[config.id as GraphicRuntimeId]
	return adapter?.type === config.type ? adapter : null
}
