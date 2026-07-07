/**
 * Canvas format helper — 프레임(grid) 종횡비가 허용 포맷 목록 중 하나와 맞는지 판정하는
 * 순수 checker 함수를 만든다. 룰별 허용 포맷 상수는 references가 소유한다.
 */
import type { AlgorithmChecker, AlgorithmCheckResult } from '../types'

export interface CanvasFormat {
	label: string
	width: number
	height: number
}

// 캔버스는 규격 px로 내보내는 게 정상이라 오차는 좁게 본다. (knob — A4 0.707 vs 3:5 0.75 구분 유지 한계 ~3%)
const RATIO_TOLERANCE = 0.02

/** 허용 포맷 중 가장 가까운 것과의 비율 편차로 pass/fail을 정한다 (방향 구분 유지). */
export function makeCanvasFormatChecker(formats: CanvasFormat[]): AlgorithmChecker {
	return ({ grid }): AlgorithmCheckResult => {
		if (!grid) return { status: 'fail', fulfillment: null, detail: 'grid 없음' }
		const aspect = grid.width / grid.height
		let best = formats[0]
		let bestDiff = Number.POSITIVE_INFINITY
		for (const format of formats) {
			const target = format.width / format.height
			const diff = Math.abs(aspect - target) / target
			if (diff < bestDiff) {
				bestDiff = diff
				best = format
			}
		}
		const ok = bestDiff <= RATIO_TOLERANCE
		return {
			status: ok ? 'pass' : 'fail',
			fulfillment: Math.round(Math.max(0, 1 - bestDiff) * 1000) / 10,
			detail: `${grid.width}×${grid.height}px — 최근접 규격 ${best.label} 편차 ${(bestDiff * 100).toFixed(1)}% (허용 ${RATIO_TOLERANCE * 100}%)`,
			metric: {
				expected: `${best.label} (±${RATIO_TOLERANCE * 100}%)`,
				actual: `${grid.width}×${grid.height}px`,
			},
			facts: {
				allowedFormats: formats.map((format) => format.label),
				closestFormat: best.label,
			},
		}
	}
}
