/**
 * Checker: 광고 캔버스 규격(온라인 비율/오프라인 mm)에 맞는지 본다.
 * ruleKey는 `application.advertisement.format`, 파일명은 광고 규격 판정 기능을 따른다.
 */

import { ADVERTISEMENT_FORMATS } from '@/features/asset-check/references/geometry.references'
import { makeCanvasFormatChecker } from './canvas-format'

export const advertisementFormatChecker = makeCanvasFormatChecker(ADVERTISEMENT_FORMATS)
