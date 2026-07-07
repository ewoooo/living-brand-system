/**
 * Checker: 오프라인 광고 템플릿 규격(mm)에 비율이 맞는지 본다.
 * ruleKey는 `layout.advertisement.template`, 파일명은 광고 템플릿 규격 판정 기능을 따른다.
 */
import { makeCanvasFormatChecker } from './canvas-format'

// 룰 기준값: Offline Vertical 1440×2100mm; Horizontal 2400×1600mm; Horizontal(long) 8600×2100mm.
// mm 절대 크기는 래스터에서 알 수 없어 비율로 판정한다.
export const advertisementTemplateFormatChecker = makeCanvasFormatChecker(
	'layout.advertisement.template',
	[
		{ label: 'Offline Vertical 1440×2100mm', width: 1440, height: 2100 },
		{ label: 'Offline Horizontal 2400×1600mm', width: 2400, height: 1600 },
		{ label: 'Offline Horizontal(long) 8600×2100mm', width: 8600, height: 2100 },
	],
)
