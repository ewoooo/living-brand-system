'use client'

import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type {
	GraphicRuntimeId,
	graphicStudioConfigs,
} from '@/features/graphic-generation/domain/graphic-studio-manifest'
import { forwardStraightPreviewAdapter } from '@/features/graphic-generation/runtime/client/forward-straight-preview.client'
import { radialFlutedGlassPreviewAdapter } from '@/features/graphic-generation/runtime/client/radial-fluted-glass-preview.client'
import type {
	ControllerControlValue,
	ControllerValues,
} from '@/modules/studio-controller/controller-definition'

export type GraphicPreview = {
	update(values: ControllerValues): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	video?: {
		canvas: HTMLCanvasElement
		renderFrame(timeSeconds: number, width: number, height: number): void
		restore(): void
	}
	destroy(): void
}

type GraphicManifest = (typeof graphicStudioConfigs)[number]
type GraphicPreviewFor<Id extends GraphicRuntimeId> = Id extends GraphicRuntimeId
	? 'mp4' extends Extract<GraphicManifest, { id: Id }>['output']['formats'][number]
		? GraphicPreview & { video: NonNullable<GraphicPreview['video']> }
		: GraphicPreview
	: never

export type GraphicPreviewAdapter<Id extends GraphicRuntimeId = GraphicRuntimeId> = {
	type: GraphicStudioConfig['type']
	mount(options: {
		container: HTMLElement
		values: ControllerValues
		onChange: (controlId: string, value: ControllerControlValue) => boolean
	}): Promise<GraphicPreviewFor<Id>>
}

type GraphicPreviewCatalog = {
	[Id in GraphicRuntimeId]: GraphicPreviewAdapter<Id>
}

const graphicPreviewCatalog = {
	'forward-straight': forwardStraightPreviewAdapter,
	'radial-fluted-glass': radialFlutedGlassPreviewAdapter,
} satisfies GraphicPreviewCatalog

/** Config id와 runtime type이 모두 일치하는 브라우저 Preview adapter만 반환한다. */
export function getGraphicPreviewAdapter(
	config: GraphicStudioConfig,
): GraphicPreviewAdapter | null {
	const adapter = graphicPreviewCatalog[config.id as GraphicRuntimeId]
	return adapter?.type === config.type ? adapter : null
}
