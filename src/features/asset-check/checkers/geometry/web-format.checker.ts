/**
 * Checker: 웹 배너 규격(16:9, 3:1)에 맞는지 본다.
 * ruleKey는 `application.web`, 파일명은 웹 규격 판정 기능을 따른다.
 */

import { WEB_FORMATS } from '@/features/asset-check/references/geometry.references'
import { makeCanvasFormatChecker } from './canvas-format'

export const webFormatChecker = makeCanvasFormatChecker(WEB_FORMATS)
