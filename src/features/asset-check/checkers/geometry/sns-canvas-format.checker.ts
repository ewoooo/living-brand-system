/**
 * Checker: SNS 기본 캔버스(3:5 표기, 1080×1440px)에 맞는지 본다.
 * ruleKey는 `application.sns.canvas.format`, 파일명은 SNS 캔버스 규격 판정 기능을 따른다.
 */

import { SNS_CANVAS_FORMATS } from '@/features/asset-check/references/geometry.references'
import { makeCanvasFormatChecker } from './canvas-format'

export const snsCanvasFormatChecker = makeCanvasFormatChecker(SNS_CANVAS_FORMATS)
