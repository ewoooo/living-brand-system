'use client'

import {
	toControllerPadValue,
	toForwardStraightInput,
} from '@/features/generate-graphic/forward-straight'
import { toRadialFlutedGlassInput } from '@/features/generate-graphic/radial-fluted-glass'
import type { GraphicStudioConfig } from '@/features/graphic-studio/graphic-studio-config'
import {
	forwardStraightGraphicConfig,
	radialFlutedGlassGraphicConfig,
} from '@/features/graphic-studio/graphic-studio-runtime'
import type {
	ControllerControlValue,
	ControllerValues,
} from '@/features/studio-controller/controller-definition'

export type GraphicPreview = {
	update(values: ControllerValues): void
	resize(width: number, height: number): void
	getViewport(): { width: number; height: number }
	destroy(): void
}

type GraphicPreviewAdapter = {
	type: GraphicStudioConfig['type']
	mount(options: {
		container: HTMLElement
		values: ControllerValues
		onChange: (controlId: string, value: ControllerControlValue) => boolean
	}): Promise<GraphicPreview>
}

const graphicPreviewRegistry = {
	[forwardStraightGraphicConfig.id]: {
		type: 'p5',
		async mount({ container, values, onChange }) {
			const { createForwardStraightPreview } = await import(
				'@/features/generate-graphic/preview.client'
			)
			const preview = createForwardStraightPreview({
				container,
				input: toForwardStraightInput(values),
				onInputChange: (next) => onChange('origin', toControllerPadValue(next.origin)),
			})
			return {
				update: (next) => preview.update(toForwardStraightInput(next)),
				resize: (width, height) => preview.resize(width, height),
				getViewport: () => preview.getViewport(),
				destroy: () => preview.destroy(),
			}
		},
	},
	[radialFlutedGlassGraphicConfig.id]: {
		type: 'shader',
		async mount({ container, values }) {
			const { createRadialFlutedGlassPreview } = await import(
				'@/features/generate-graphic/radial-fluted-glass-preview.client'
			)
			const preview = await createRadialFlutedGlassPreview({
				container,
				input: toRadialFlutedGlassInput(values),
			})
			return {
				update: (next) => preview.update(toRadialFlutedGlassInput(next)),
				resize: (width, height) => preview.resize(width, height),
				getViewport: () => preview.getViewport(),
				destroy: () => preview.destroy(),
			}
		},
	},
} satisfies Record<string, GraphicPreviewAdapter>

/** Config id와 runtime type이 모두 일치하는 브라우저 Preview adapter만 반환한다. */
export function getGraphicPreviewAdapter(
	config: GraphicStudioConfig,
): GraphicPreviewAdapter | null {
	const adapter = graphicPreviewRegistry[config.id as keyof typeof graphicPreviewRegistry]
	return adapter?.type === config.type ? adapter : null
}
