// 이 파일은 scripts/generate-graphic-runtime-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import forwardStraightManifest from '../forward-straight/definition'
import radialFlutedGlassManifest from '../radial-fluted-glass/definition'

export const graphicRuntimeManifests = [
	forwardStraightManifest, // forward-straight
	radialFlutedGlassManifest, // radial-fluted-glass
] as const

export type GraphicRuntimeId = (typeof graphicRuntimeManifests)[number]['id']
