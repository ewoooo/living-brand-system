// 이 파일은 scripts/generate-graphic-runtime-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import type { GraphicStudioPlugin } from '../../runtime/graphic-plugin'
import forwardStraightManifest from '../forward-straight/definition'
import forwardStraightModel from '../forward-straight/model'
import keyVisualPatternManifest from '../key-visual-pattern/definition'
import keyVisualPatternModel from '../key-visual-pattern/model'
import linearFlutedGlassManifest from '../linear-fluted-glass/definition'
import linearFlutedGlassModel from '../linear-fluted-glass/model'
import radialFlutedGlassManifest from '../radial-fluted-glass/definition'
import radialFlutedGlassModel from '../radial-fluted-glass/model'
import sweepFlutedGlassManifest from '../sweep-fluted-glass/definition'
import sweepFlutedGlassModel from '../sweep-fluted-glass/model'
import verticalFlutedGlassManifest from '../vertical-fluted-glass/definition'
import verticalFlutedGlassModel from '../vertical-fluted-glass/model'

export const graphicStudioPlugins = [
	{ manifest: forwardStraightManifest, ...forwardStraightModel },
	{ manifest: keyVisualPatternManifest, ...keyVisualPatternModel },
	{ manifest: linearFlutedGlassManifest, ...linearFlutedGlassModel },
	{ manifest: radialFlutedGlassManifest, ...radialFlutedGlassModel },
	{ manifest: sweepFlutedGlassManifest, ...sweepFlutedGlassModel },
	{ manifest: verticalFlutedGlassManifest, ...verticalFlutedGlassModel },
] as const satisfies readonly GraphicStudioPlugin[]
