import { defineGraphicStudioPlugin } from '@/features/graphic-studio/graphic-plugin'
import { radialFlutedGlassGraphicConfig } from '@/features/graphic-studio/graphics/radial-fluted-glass-manifest'
import type { ControllerRuntimeBindings } from '@/features/studio-controller/controller-definition'

export const radialFlutedGlassGraphicPlugin = defineGraphicStudioPlugin({
	manifest: radialFlutedGlassGraphicConfig,
	getBindings: (viewport): ControllerRuntimeBindings =>
		viewport.width > 0 && viewport.height > 0
			? { source: { padAspectRatio: viewport.width / viewport.height } }
			: {},
})
