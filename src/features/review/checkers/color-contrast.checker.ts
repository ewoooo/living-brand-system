import { relativeLuminance } from '@/features/review/color-metrics'
import type { RuleChecker } from './types'

const MIN_CONTRAST = 4.5 // WCAG AA (본문 기준)

/** color.contrast: 이미지 밝은 영역 vs 어두운 영역의 명암 대비비(가독성 근사). */
export const colorContrastChecker: RuleChecker = {
	ruleKey: 'color.contrast',
	check: ({ pixels }) => {
		if (pixels.length < 2) return { status: 'fail', fulfillment: 0, detail: '픽셀 부족' }
		const lums = pixels.map(relativeLuminance).sort((a, b) => a - b)
		const lo = lums[Math.floor(lums.length * 0.1)] // 어두운 쪽 10분위
		const hi = lums[Math.floor(lums.length * 0.9)] // 밝은 쪽 90분위
		const ratio = (hi + 0.05) / (lo + 0.05)
		return {
			status: ratio >= MIN_CONTRAST ? 'pass' : 'fail',
			fulfillment: Math.min(100, Math.round((ratio / MIN_CONTRAST) * 100)),
			detail: `명암 대비비 ${ratio.toFixed(1)}:1 (기준 ${MIN_CONTRAST}:1)`,
		}
	},
}
