/**
 * Checker: 산출물 프레임의 종횡비가 목표 비율에 맞는지 본다.
 * ruleKey는 `application.stationery.format`, 파일명은 실제 측정 기능인 aspect-ratio를 따른다.
 */

import { STATIONERY_FORMAT_RATIOS } from '@/features/asset-check/references/geometry.references'
import type { AlgorithmChecker } from '../types'

const TOLERANCE = 0.05

/**
 * application.stationery.format: 스테이셔너리 규격 비율 중 하나에 맞는지 검수한다.
 * mm/DPI 없이 판정 가능한 축 = 종횡비. 픽셀 grid의 긴변/짧은변 비율을 허용 포맷과 비교한다.
 */
export const aspectRatioChecker: AlgorithmChecker = ({ grid }) => {
	if (!grid) return { status: 'fail', fulfillment: null, detail: 'grid 없음' }
	const aspect = Math.max(grid.width, grid.height) / Math.min(grid.width, grid.height)
	let best = STATIONERY_FORMAT_RATIOS[0]
	let diff = Number.POSITIVE_INFINITY
	for (const format of STATIONERY_FORMAT_RATIOS) {
		const formatDiff = Math.abs(aspect - format.ratio) / format.ratio
		if (formatDiff < diff) {
			best = format
			diff = formatDiff
		}
	}
	const pass = diff <= TOLERANCE
	return {
		status: pass ? 'pass' : 'fail',
		fulfillment: Math.round(Math.max(0, 1 - diff) * 1000) / 10,
		detail: pass ? 'format ratio matched' : 'format ratio mismatched',
		metric: {
			expected: `${best.label} (±${TOLERANCE * 100}%)`,
			actual: aspect.toFixed(2),
		},
		facts: {
			allowedFormats: STATIONERY_FORMAT_RATIOS.map((format) => format.label),
			closestFormat: best.label,
		},
	}
}
