import { radialFlutedGlassGraphicConfig } from '@/features/graphic-generation/domain/manifests/radial-fluted-glass'
import { defineGraphicStudioPlugin } from '@/features/graphic-generation/runtime/graphic-plugin'
import type { ControllerRuntimeBindings } from '@/modules/studio-controller/controller-definition'

export const radialFlutedGlassGraphicPlugin = defineGraphicStudioPlugin({
	manifest: radialFlutedGlassGraphicConfig,
	getBindings: (viewport): ControllerRuntimeBindings =>
		viewport.width > 0 && viewport.height > 0
			? { source: { padAspectRatio: viewport.width / viewport.height } }
			: {},
})
