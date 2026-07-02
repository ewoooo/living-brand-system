import type { RuleChecker } from './types'

// 명함 규격 90:50 비율. 방향 무관(긴변/짧은변)으로 보고 허용오차 내면 통과. (러프 — target/tol은 knob)
const TARGET_RATIO = 90 / 50
const TOLERANCE = 0.05

/**
 * application.format: 명함 규격 비율(90:50)을 지키는지 검수한다 (Stationary 섹션, 명함 고정).
 * mm/DPI 없이 판정 가능한 축 = 종횡비. 픽셀 grid의 긴변/짧은변 비율을 목표 비율과 비교한다.
 * (아이템별 target 파라미터화는 후속 — 지금은 명함 90:50 고정.)
 */
export const stationaryFormatChecker: RuleChecker = {
	ruleKey: 'application.format',
	check: ({ grid }) => {
		if (!grid) return { status: 'fail', fulfillment: null, detail: 'grid 없음' }
		const aspect = Math.max(grid.width, grid.height) / Math.min(grid.width, grid.height)
		const diff = Math.abs(aspect - TARGET_RATIO) / TARGET_RATIO
		return {
			status: diff <= TOLERANCE ? 'pass' : 'fail',
			fulfillment: Math.round(Math.max(0, 1 - diff) * 1000) / 10,
			detail: `비율 ${aspect.toFixed(2)} (명함 목표 ${TARGET_RATIO.toFixed(1)} ±${TOLERANCE * 100}%)`,
		}
	},
}
