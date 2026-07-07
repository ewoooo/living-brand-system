/**
 * Checker: 웹 배너 규격(16:9, 3:1)에 맞는지 본다.
 * ruleKey는 `application.web`, 파일명은 웹 규격 판정 기능을 따른다.
 */
import { makeCanvasFormatChecker } from './canvas-format'

// 룰 기준값: 16:9 (Web/Horizontal AD) = 1920×1080px; 3:1 (Horizontal AD) = 1920×640px.
export const webFormatChecker = makeCanvasFormatChecker('application.web', [
	{ label: '16:9 1920×1080px', width: 16, height: 9 },
	{ label: '3:1 1920×640px', width: 3, height: 1 },
])
