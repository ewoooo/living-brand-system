'use client'

import {
	toControllerPadValue,
	toForwardStraightInput,
} from '@/features/graphic-generation/forward-straight'
import type { GraphicPreviewAdapter } from '@/features/graphic-generation/runtime/client/graphic-preview.client'

export const forwardStraightPreviewAdapter = {
	type: 'p5',
	async mount({ container, values, onChange }) {
		const { createForwardStraightPreview } = await import(
			'@/features/graphic-generation/preview.client'
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
} satisfies GraphicPreviewAdapter<'forward-straight'>
