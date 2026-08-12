import { toForwardStraightInput } from '@/features/generate-graphic/forward-straight'
import {
	createForwardStraightScene,
	createForwardStraightSvg,
} from '@/features/generate-graphic/forward-straight-geometry'
import { defineGraphicStudioPlugin } from '@/features/graphic-studio/graphic-plugin'
import { forwardStraightGraphicConfig } from '@/features/graphic-studio/graphics/forward-straight-manifest'
import type { ControllerRuntimeBindings } from '@/features/studio-controller/controller-definition'

export const forwardStraightGraphicPlugin = defineGraphicStudioPlugin({
	manifest: forwardStraightGraphicConfig,
	renderSvg: (values, viewport) =>
		createForwardStraightSvg(
			createForwardStraightScene(toForwardStraightInput(values), viewport),
		),
	getBindings: (viewport): ControllerRuntimeBindings =>
		viewport.width > 0 && viewport.height > 0
			? { origin: { padAspectRatio: viewport.width / viewport.height } }
			: {},
})
