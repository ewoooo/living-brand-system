import { hexToRgb } from '@/features/review/color-check'
import { lightness } from '@/features/review/color-metrics'
import { ESSENHERB_SWATCHES } from '@/features/review/essenherb-palette'
import type { RuleChecker } from './types'

// 팔레트 swatch들의 명도 단계 (Light~Dark 톤)
const SWATCH_LIGHTNESS = ESSENHERB_SWATCHES.map((s) => lightness(hexToRgb(s.hex)))
const LIGHTNESS_TOLERANCE = 0.08
const PASS_THRESHOLD = 80

/** color.scale: 픽셀 명도가 팔레트의 톤 단계에 정렬되는지(off-scale 비율). */
export const colorScaleChecker: RuleChecker = {
	ruleKey: 'color.scale',
	check: ({ pixels }) => {
		if (pixels.length === 0) return { status: 'fail', fulfillment: 0, detail: '픽셀 없음' }
		let onScale = 0
		for (const px of pixels) {
			const l = lightness(px)
			if (SWATCH_LIGHTNESS.some((sl) => Math.abs(sl - l) <= LIGHTNESS_TOLERANCE)) onScale += 1
		}
		const pct = Math.round((onScale / pixels.length) * 1000) / 10
		return {
			status: pct >= PASS_THRESHOLD ? 'pass' : 'fail',
			fulfillment: pct,
			detail: `${onScale}/${pixels.length} 픽셀이 팔레트 명도 단계에 정렬 (기준 ${PASS_THRESHOLD}%)`,
		}
	},
}
