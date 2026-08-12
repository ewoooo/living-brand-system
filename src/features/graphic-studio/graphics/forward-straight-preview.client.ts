'use client'

import {
	toControllerPadValue,
	toForwardStraightInput,
} from '@/features/generate-graphic/forward-straight'
import type { GraphicPreviewAdapter } from '@/features/graphic-studio/graphic-preview.client'

export const forwardStraightPreviewAdapter = {
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
} satisfies GraphicPreviewAdapter
