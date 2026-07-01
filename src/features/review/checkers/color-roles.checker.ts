import { nearestSwatch } from '@/features/review/color-check'
import { dominantColors } from '@/features/review/color-metrics'
import {
	ESSENHERB_MAIN_HEX,
	ESSENHERB_SUPPORTING_HEXES,
	ESSENHERB_SWATCHES,
	PALETTE_DELTA_E_TOLERANCE,
} from '@/features/review/essenherb-palette'
import type { RuleChecker } from './types'

const MIN_MAIN_SHARE = 0.02 // 메인 컬러 최소 점유율 (강조색이라 면적 작아도 인정)
const MAX_OFF_SHARE = 0.5 // 팔레트 밖 색이 지배색의 절반 넘으면 역할 붕괴로 간주

/**
 * color.roles: 지배색을 역할군(main/supporting/multi/off-palette)으로 분류해
 * 브랜드 메인 컬러가 주색으로 쓰였는지, 역할 밖 색이 지배하지 않는지 판정한다.
 * "메인이 어디 배치됐나"(영역)가 아니라 "메인이 충분히 쓰였나"(전역 통계)로 재정의한 방식.
 */
export const colorRolesChecker: RuleChecker = {
	ruleKey: 'color.roles',
	check: ({ pixels }) => {
		if (pixels.length === 0) return { status: 'fail', fulfillment: 0, detail: '픽셀 없음' }
		const colors = dominantColors(pixels, 8, 0.02)
		if (colors.length === 0) {
			return { status: 'fail', fulfillment: 0, detail: '지배색 없음' }
		}

		let main = 0
		let supporting = 0
		let multi = 0
		let off = 0
		for (const color of colors) {
			const { swatch, distance } = nearestSwatch(color.rgb, ESSENHERB_SWATCHES)
			if (distance > PALETTE_DELTA_E_TOLERANCE) {
				off += color.share
			} else if (swatch.hex === ESSENHERB_MAIN_HEX) {
				main += color.share
			} else if (ESSENHERB_SUPPORTING_HEXES.includes(swatch.hex)) {
				supporting += color.share
			} else {
				multi += color.share
			}
		}

		const covered = main + supporting + multi + off
		const offRatio = covered === 0 ? 0 : off / covered
		const mainUsed = main >= MIN_MAIN_SHARE
		const pass = mainUsed && offRatio <= MAX_OFF_SHARE

		const pctOf = (v: number) => Math.round((v / covered) * 100)
		const detail = mainUsed
			? `메인 ${pctOf(main)}% · 보조 ${pctOf(supporting)}% · 멀티 ${pctOf(multi)}% · 팔레트밖 ${pctOf(off)}%`
			: `메인 컬러(Essenherb Red) 사용 부족 (${pctOf(main)}%, 기준 ${MIN_MAIN_SHARE * 100}%↑)`

		return {
			status: pass ? 'pass' : 'fail',
			fulfillment: Math.round((1 - offRatio) * 1000) / 10,
			detail,
		}
	},
}
