import { checkColorPalette } from '@/features/review/color-check'
import {
	ESSENHERB_PASS_THRESHOLD,
	ESSENHERB_SWATCHES,
	PALETTE_DELTA_E_TOLERANCE,
} from '@/features/review/essenherb-palette'
import type { RuleChecker } from './types'

/** color.palette: 샘플 픽셀을 essenherb 지정 swatch에 deltaE 매칭해 충족률을 낸다. */
export const colorPaletteChecker: RuleChecker = {
	ruleKey: 'color.palette',
	check: ({ pixels }) => {
		const result = checkColorPalette(
			pixels,
			ESSENHERB_SWATCHES,
			ESSENHERB_PASS_THRESHOLD,
			PALETTE_DELTA_E_TOLERANCE,
		)
		return {
			status: result.pass ? 'pass' : 'fail',
			fulfillment: result.fulfillment,
			detail: `${result.matched}/${result.sampled} 픽셀이 지정 팔레트 내 (통과선 ${result.threshold}%)`,
		}
	},
}
