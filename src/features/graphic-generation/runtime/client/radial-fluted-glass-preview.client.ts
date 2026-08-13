'use client'

import { toRadialFlutedGlassInput } from '@/features/graphic-generation/radial-fluted-glass'
import type { GraphicPreviewAdapter } from '@/features/graphic-generation/runtime/client/graphic-preview.client'

export const radialFlutedGlassPreviewAdapter = {
	type: 'shader',
	async mount({ container, values }) {
		const { createRadialFlutedGlassPreview } = await import(
			'@/features/graphic-generation/radial-fluted-glass-preview.client'
		)
		const preview = await createRadialFlutedGlassPreview({
			container,
			input: toRadialFlutedGlassInput(values),
		})
		return {
			update: (next) => preview.update(toRadialFlutedGlassInput(next)),
			resize: (width, height) => preview.resize(width, height),
			getViewport: () => preview.getViewport(),
			video: preview.video,
			destroy: () => preview.destroy(),
		}
	},
} satisfies GraphicPreviewAdapter<'radial-fluted-glass'>
