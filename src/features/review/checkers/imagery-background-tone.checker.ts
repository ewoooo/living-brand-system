import { lightness, saturation } from '@/features/review/color-metrics'
import type { RuleChecker } from './types'

const MIN_LIGHTNESS = 0.7 // 밝음
const MAX_SATURATION = 0.25 // 무채색

/** imagery.background-tone: 사진 배경이 "밝은 무채색"인지 (평균 밝기↑·채도↓). */
export const imageryBackgroundToneChecker: RuleChecker = {
	ruleKey: 'imagery.background-tone',
	check: ({ pixels }) => {
		if (pixels.length === 0) return { status: 'fail', fulfillment: 0, detail: '픽셀 없음' }
		const avgL = pixels.reduce((sum, p) => sum + lightness(p), 0) / pixels.length
		const avgS = pixels.reduce((sum, p) => sum + saturation(p), 0) / pixels.length
		const pass = avgL >= MIN_LIGHTNESS && avgS <= MAX_SATURATION
		const score = Math.min(avgL / MIN_LIGHTNESS, 1) * 0.5 + Math.min((1 - avgS) / (1 - MAX_SATURATION), 1) * 0.5
		return {
			status: pass ? 'pass' : 'fail',
			fulfillment: Math.round(score * 100),
			detail: `평균 밝기 ${(avgL * 100).toFixed(0)}% · 채도 ${(avgS * 100).toFixed(0)}% (밝은 무채색 기준)`,
		}
	},
}
