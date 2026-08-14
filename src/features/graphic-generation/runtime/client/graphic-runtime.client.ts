'use client'

import type { GraphicRuntimeManifest } from '@/features/graphic-generation/domain/graphic-studio-config'
import type { GraphicRuntimeId } from '@/features/graphic-generation/graphic-runtimes/catalog/manifest.generated'
import { graphicRuntimeCatalog } from '@/features/graphic-generation/graphic-runtimes/catalog/runtime.generated.client'
import type {
	CanvasVideoSource,
	RasterArtifact,
	VideoArtifact,
} from '@/modules/studio-artifact/studio-artifact'
import type {
	ControllerControlValue,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'

export type GraphicBrowserArtifacts = {
	raster: RasterArtifact
	video?: VideoArtifact<CanvasVideoSource>
}

export type GraphicRuntime = {
	update(values: ControllerValues): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	artifacts: GraphicBrowserArtifacts
	destroy(): void
}

export type GraphicRuntimeAdapter = {
	type: GraphicRuntimeManifest['type']
	mount(options: {
		container: HTMLElement
		values: ControllerValues
		onChange: (controlId: string, value: ControllerControlValue) => boolean
	}): Promise<GraphicRuntime>
}

export type GraphicRuntimeLoader = () => Promise<GraphicRuntimeAdapter>

/** Canvas 정적 렌더를 Raster Artifact로 노출하고 export 뒤 현재 preview 크기를 복원한다. */
export function createGraphicRasterArtifact({
	canvas,
	getViewport,
	render,
}: {
	canvas: HTMLCanvasElement
	getViewport: () => { width: number; height: number }
	render: (width: number, height: number) => void
}): RasterArtifact {
	return {
		kind: 'raster',
		source: {
			withSurface: (options, consume) => {
				const current = getViewport()
				const width = options.width ?? current.width
				const height = options.height ?? current.height
				const restore = () => render(current.width, current.height)
				try {
					render(width, height)
					const result = consume({ kind: 'canvas', element: canvas, width, height })
					if (result instanceof Promise) return result.finally(restore)
					restore()
					return result
				} catch (error) {
					restore()
					throw error
				}
			},
		},
	}
}

/** 선택한 Config의 브라우저 runtime만 지연 로드하고 id와 runtime type이 맞는 adapter를 반환한다. */
export async function loadGraphicRuntimeAdapter(
	config: GraphicRuntimeManifest,
): Promise<GraphicRuntimeAdapter | null> {
	const load = graphicRuntimeCatalog[config.id as GraphicRuntimeId]
	const adapter = await load?.()
	return adapter?.type === config.type ? adapter : null
}
