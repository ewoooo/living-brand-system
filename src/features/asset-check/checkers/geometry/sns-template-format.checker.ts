/**
 * Checker: SNS 템플릿 캔버스(Feed/Reels)에 맞는지 본다.
 * ruleKey는 `layout.sns.template`, 파일명은 SNS 템플릿 규격 판정 기능을 따른다.
 */
import { makeCanvasFormatChecker } from './canvas-format'

// 룰 기준값 중 캔버스 규격만 판정한다: Feed 1080×1440px, Reels 1080×1920px.
// padding 80px·썸네일 존 규정은 요소(텍스트/이미지) 구분이 필요해 이 checker의 범위 밖이다.
export const snsTemplateFormatChecker = makeCanvasFormatChecker('layout.sns.template', [
	{ label: 'Feed 1080×1440px', width: 1080, height: 1440 },
	{ label: 'Reels 1080×1920px', width: 1080, height: 1920 },
])
