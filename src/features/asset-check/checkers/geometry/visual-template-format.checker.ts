/**
 * Checker: 비주얼 템플릿 캔버스 규격(1:1, 3:5, A4, 3:1, 16:9)에 맞는지 본다.
 * ruleKey는 `layout.visual.template`, 파일명은 템플릿 규격 판정 기능을 따른다.
 */

import { VISUAL_TEMPLATE_FORMATS } from '@/features/asset-check/references/geometry.references'
import { makeCanvasFormatChecker } from './canvas-format'

export const visualTemplateFormatChecker = makeCanvasFormatChecker(VISUAL_TEMPLATE_FORMATS)
