import { forwardStraightGraphicConfig } from '@/features/graphic-generation/domain/manifests/forward-straight'
import { toForwardStraightInput } from '@/features/graphic-generation/forward-straight'
import {
	createForwardStraightScene,
	createForwardStraightSvg,
} from '@/features/graphic-generation/forward-straight-geometry'
import { defineGraphicStudioPlugin } from '@/features/graphic-generation/runtime/graphic-plugin'
import type { ControllerRuntimeBindings } from '@/modules/studio-controller/controller-definition'

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
