/**
 * Checker: 오프라인 광고 템플릿 규격(mm)에 비율이 맞는지 본다.
 * ruleKey는 `layout.advertisement.template`, 파일명은 광고 템플릿 규격 판정 기능을 따른다.
 */

import { ADVERTISEMENT_TEMPLATE_FORMATS } from '@/features/asset-check/references/geometry.references'
import { makeCanvasFormatChecker } from './canvas-format'

export const advertisementTemplateFormatChecker = makeCanvasFormatChecker(
	ADVERTISEMENT_TEMPLATE_FORMATS,
)
