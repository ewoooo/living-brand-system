/**
 * Checker: SNS 템플릿 캔버스(Feed/Reels)에 맞는지 본다.
 * ruleKey는 `layout.sns.template`, 파일명은 SNS 템플릿 규격 판정 기능을 따른다.
 */

import { SNS_FORMATS } from '@/features/asset-check/references/geometry.references'
import { makeCanvasFormatChecker } from './canvas-format'

export const snsTemplateFormatChecker = makeCanvasFormatChecker(SNS_FORMATS)
