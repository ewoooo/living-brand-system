// 이 파일은 scripts/generate-graphic-runtime-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import forwardStraightManifest from '../forward-straight/definition'
import linearFlutedGlassManifest from '../linear-fluted-glass/definition'
import radialFlutedGlassManifest from '../radial-fluted-glass/definition'
import sweepFlutedGlassManifest from '../sweep-fluted-glass/definition'
import verticalFlutedGlassManifest from '../vertical-fluted-glass/definition'

export const graphicRuntimeManifests = [
	forwardStraightManifest, // forward-straight
	linearFlutedGlassManifest, // linear-fluted-glass
	radialFlutedGlassManifest, // radial-fluted-glass
	sweepFlutedGlassManifest, // sweep-fluted-glass
	verticalFlutedGlassManifest, // vertical-fluted-glass
] as const

export type GraphicRuntimeId = (typeof graphicRuntimeManifests)[number]['id']
