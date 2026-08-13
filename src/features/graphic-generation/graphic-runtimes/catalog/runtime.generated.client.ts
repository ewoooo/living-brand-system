// 이 파일은 scripts/generate-graphic-runtime-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

'use client'

import type { GraphicRuntimeAdapter } from '../../runtime/client/graphic-runtime.client'
import forwardStraightRuntime from '../forward-straight/runtime.client'
import radialFlutedGlassRuntime from '../radial-fluted-glass/runtime.client'
import type { GraphicRuntimeId } from './manifest.generated'

export const graphicRuntimeCatalog = {
	'forward-straight': forwardStraightRuntime,
	'radial-fluted-glass': radialFlutedGlassRuntime,
} satisfies Record<GraphicRuntimeId, GraphicRuntimeAdapter>
