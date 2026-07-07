/**
 * Checker: 브랜드 팔레트 준수 여부를 본다.
 * ruleKey는 `color.palette`, 파일명은 지배색이 허용 팔레트에 들어오는지 보는 기능을 따른다.
 */
import type { RuleChecker } from '../types'
import { dominantColors } from './color-metrics'
import { nearestSwatch, PALETTE_DELTA_E_TOLERANCE } from './palette-match'

// 규정 외 색이 지배색 점유율의 이 비율을 넘으면 미통과 (작은 로고 색 위반도 잡도록 지배색 기반).
const MAX_OFF_SHARE = 0.05

/**
 * color.palette: 지배색이 지정 팔레트 안에 드는지 검수한다.
 * 픽셀 전수가 아니라 지배색(작은 요소 포함) 기반으로 규정 외 색(off-palette) 점유율을 본다 —
 * flat 디자인에서 작은 로고의 규정 외 색까지 잡기 위함.
 */
export const paletteComplianceChecker: RuleChecker = {
	ruleKey: 'color.palette',
	check: ({ pixels, palette }) => {
		if (pixels.length === 0) return { status: 'fail', fulfillment: 0, detail: '픽셀 없음' }
		if (palette.length === 0) return { status: 'fail', fulfillment: 0, detail: '팔레트 없음' }
		const colors = dominantColors(pixels, 12, 0.01)
		if (colors.length === 0) return { status: 'fail', fulfillment: 0, detail: '지배색 없음' }

		let offShare = 0
		for (const color of colors) {
			const { distance } = nearestSwatch(color.rgb, palette)
			if (distance > PALETTE_DELTA_E_TOLERANCE) offShare += color.share
		}
		const totalShare = colors.reduce((sum, color) => sum + color.share, 0)
		const offRatio = totalShare === 0 ? 0 : offShare / totalShare

		return {
			status: offRatio <= MAX_OFF_SHARE ? 'pass' : 'fail',
			fulfillment: Math.round((1 - offRatio) * 1000) / 10,
			detail: `지배색 중 규정 외 색 ${Math.round(offRatio * 100)}% (허용 ${MAX_OFF_SHARE * 100}%)`,
			metric: {
				expected: `${MAX_OFF_SHARE * 100}% 이내`,
				actual: `${Math.round(offRatio * 100)}%`,
			},
		}
	},
}
