// 이 파일은 scripts/generate-graphic-runtime-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

'use client'

import type { GraphicRuntimeLoader } from '../../runtime/client/graphic-runtime.client'
import type { GraphicRuntimeId } from './manifest.generated'

export const graphicRuntimeCatalog = {
	'forward-straight': () =>
		import('../forward-straight/runtime.client').then((module) => module.default),
	'linear-fluted-glass': () =>
		import('../linear-fluted-glass/runtime.client').then((module) => module.default),
	'radial-fluted-glass': () =>
		import('../radial-fluted-glass/runtime.client').then((module) => module.default),
} satisfies Record<GraphicRuntimeId, GraphicRuntimeLoader>
