// 이 파일은 scripts/generate-graphic-runtime-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import { defineGraphicStudioPlugin } from '../../runtime/graphic-plugin'
import forwardStraightManifest from '../forward-straight/definition'
import forwardStraightModel from '../forward-straight/model'
import radialFlutedGlassManifest from '../radial-fluted-glass/definition'
import radialFlutedGlassModel from '../radial-fluted-glass/model'

export const graphicStudioPlugins = [
	defineGraphicStudioPlugin({ manifest: forwardStraightManifest, ...forwardStraightModel }),
	defineGraphicStudioPlugin({ manifest: radialFlutedGlassManifest, ...radialFlutedGlassModel }),
] as const
