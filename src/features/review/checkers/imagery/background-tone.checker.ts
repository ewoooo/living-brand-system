/**
 * Checker: 이미지 배경 톤이 밝고 낮은 채도인지 본다.
 * ruleKey는 `imagery.background-tone`, 파일명은 배경 톤 측정 기능을 따른다.
 */
import { lightness, saturation } from '../color/color-metrics'
import type { RuleChecker } from '../types'

const MIN_LIGHTNESS = 0.7 // 밝음
const MAX_SATURATION = 0.25 // 무채색

/** imagery.background-tone: 사진 배경이 "밝은 무채색"인지 (평균 밝기↑·채도↓). */
export const backgroundToneChecker: RuleChecker = {
	ruleKey: 'imagery.background-tone',
	check: ({ pixels }) => {
		if (pixels.length === 0) return { status: 'fail', fulfillment: 0, detail: '픽셀 없음' }
		const avgL = pixels.reduce((sum, p) => sum + lightness(p), 0) / pixels.length
		const avgS = pixels.reduce((sum, p) => sum + saturation(p), 0) / pixels.length
		const pass = avgL >= MIN_LIGHTNESS && avgS <= MAX_SATURATION
		const score =
			Math.min(avgL / MIN_LIGHTNESS, 1) * 0.5 +
			Math.min((1 - avgS) / (1 - MAX_SATURATION), 1) * 0.5
		return {
			status: pass ? 'pass' : 'fail',
			fulfillment: Math.round(score * 100),
			detail: `평균 밝기 ${(avgL * 100).toFixed(0)}% · 채도 ${(avgS * 100).toFixed(0)}% (밝은 무채색 기준)`,
			metric: {
				expected: `밝기 ${MIN_LIGHTNESS * 100}% 이상·채도 ${MAX_SATURATION * 100}% 이하`,
				actual: `밝기 ${(avgL * 100).toFixed(0)}%·채도 ${(avgS * 100).toFixed(0)}%`,
			},
		}
	},
}
