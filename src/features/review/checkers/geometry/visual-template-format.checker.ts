/**
 * Checker: 비주얼 템플릿 캔버스 규격(1:1, 3:5, A4, 3:1, 16:9)에 맞는지 본다.
 * ruleKey는 `layout.visual.template`, 파일명은 템플릿 규격 판정 기능을 따른다.
 */
import { makeCanvasFormatChecker } from './canvas-format'

// 룰 기준값: 1:1=1080×1080px; 3:5(SNS)=1080×1440px; A4=210×297mm; 3:1=1920×640px; 16:9=1920×1080px.
// "3:5" 라벨의 실제 규격은 1080×1440px(=3:4)이라 px 기준 비율을 쓴다.
export const visualTemplateFormatChecker = makeCanvasFormatChecker('layout.visual.template', [
	{ label: '1:1 1080×1080px', width: 1, height: 1 },
	{ label: '3:5(SNS) 1080×1440px', width: 1080, height: 1440 },
	{ label: 'A4 210×297mm', width: 210, height: 297 },
	{ label: '3:1 1920×640px', width: 3, height: 1 },
	{ label: '16:9 1920×1080px', width: 16, height: 9 },
])
