import { dominantColors, lightness } from '@/features/review/color-metrics'
import type { RuleChecker } from './types'

// essenherb Tone-on-Tone Contrast Level 근사 기준값 (명도 축 0~1)
const DARK_THRESHOLD = 0.3 // 이하 = 어두운 톤
const LIGHT_THRESHOLD = 0.7 // 이상 = 밝은 톤
const EQUAL_TONE_TOLERANCE = 0.08 // 명도차 이 이하 = 동일 톤(대비 없음)
const MIN_LIGHTNESS_DELTA = 0.12 // 조합이 확보해야 할 최소 명도차
const TOP_COLORS = 5 // 검사 대상 지배색 수
const MIN_SHARE = 0.05 // 지배색으로 인정할 최소 점유율
const PASS_THRESHOLD = 70

/**
 * color.combo-tonal-balance: 함께 쓰인 지배색 간 명도 밸런스.
 * both-dark / both-light / equal-tone 조합을 지양하고 최소 명도차를 확보하는지 본다.
 * color.contrast(전경-배경 가독성)와 달리 색 간 대칭적 톤 관계를 판정한다.
 */
export const colorComboTonalBalanceChecker: RuleChecker = {
	ruleKey: 'color.combo-tonal-balance',
	check: ({ pixels }) => {
		if (pixels.length === 0) return { status: 'fail', fulfillment: 0, detail: '픽셀 없음' }
		const colors = dominantColors(pixels, TOP_COLORS, MIN_SHARE)
		if (colors.length < 2) {
			return { status: 'pass', fulfillment: 100, detail: '지배색 1개 — 조합 판정 대상 아님' }
		}
		const ls = colors.map((color) => lightness(color.rgb))
		let good = 0
		let total = 0
		const problems = new Set<string>()
		for (let i = 0; i < ls.length; i++) {
			for (let j = i + 1; j < ls.length; j++) {
				total += 1
				const delta = Math.abs(ls[i] - ls[j])
				const bothDark = ls[i] < DARK_THRESHOLD && ls[j] < DARK_THRESHOLD
				const bothLight = ls[i] > LIGHT_THRESHOLD && ls[j] > LIGHT_THRESHOLD
				if (bothDark) problems.add('어두운끼리')
				else if (bothLight) problems.add('밝은끼리')
				else if (delta < EQUAL_TONE_TOLERANCE || delta < MIN_LIGHTNESS_DELTA)
					problems.add('동일톤')
				else good += 1
			}
		}
		const pct = Math.round((good / total) * 1000) / 10
		const problemNote = problems.size > 0 ? ` · 문제 조합: ${[...problems].join(', ')}` : ''
		return {
			status: pct >= PASS_THRESHOLD ? 'pass' : 'fail',
			fulfillment: pct,
			detail: `지배색 ${colors.length}개 중 균형 조합 ${good}/${total}쌍 (기준 ${PASS_THRESHOLD}%)${problemNote}`,
		}
	},
}
