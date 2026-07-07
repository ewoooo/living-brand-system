/**
 * Checker: SNS 캔버스 규격(Feed/Reels)에 맞는지 본다.
 * ruleKey는 `application.sns.format`, 파일명은 SNS 규격 판정 기능을 따른다.
 */
import { makeCanvasFormatChecker } from './canvas-format'

// 룰 기준값: Feed 1080×1440px, Reels 1080×1920px (썸네일 동일 규격).
export const snsFormatChecker = makeCanvasFormatChecker('application.sns.format', [
	{ label: 'Feed 1080×1440px', width: 1080, height: 1440 },
	{ label: 'Reels 1080×1920px', width: 1080, height: 1920 },
])
