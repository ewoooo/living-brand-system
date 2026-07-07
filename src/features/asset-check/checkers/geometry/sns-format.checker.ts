/**
 * Checker: SNS 캔버스 규격(Feed/Reels)에 맞는지 본다.
 * ruleKey는 `application.sns.format`, 파일명은 SNS 규격 판정 기능을 따른다.
 */

import { SNS_FORMATS } from '@/features/asset-check/references/geometry.references'
import { makeCanvasFormatChecker } from './canvas-format'

export const snsFormatChecker = makeCanvasFormatChecker(SNS_FORMATS)
