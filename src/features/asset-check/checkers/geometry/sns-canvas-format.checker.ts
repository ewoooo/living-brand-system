/**
 * Checker: SNS 기본 캔버스(3:5 표기, 1080×1440px)에 맞는지 본다.
 * ruleKey는 `application.sns.canvas.format`, 파일명은 SNS 캔버스 규격 판정 기능을 따른다.
 */
import { makeCanvasFormatChecker } from './canvas-format'

// 룰 기준값: 3:5 (SNS) = 1080×1440px. 라벨은 3:5지만 실제 px 비율(3:4)로 판정한다.
export const snsCanvasFormatChecker = makeCanvasFormatChecker('application.sns.canvas.format', [
	{ label: '3:5(SNS) 1080×1440px', width: 1080, height: 1440 },
])
