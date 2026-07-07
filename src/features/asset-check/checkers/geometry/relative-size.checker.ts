/**
 * Checker: 검출된 로고가 프레임 대비 충분히 큰지 본다.
 * ruleKey는 `logo.size.minimum`, 파일명은 상대 크기 측정 기능을 따른다.
 */

import { detectLogoRegion } from '../logo/logo-geometry'
import type { AlgorithmChecker } from '../types'

// 로고 최대변이 프레임 대비 이 비율 미만이면 "너무 작음" (러프 knob — 나중 절대 px/규정값으로 정교화).
const MIN_FRACTION = 0.08

/**
 * logo.size.minimum: 로고가 너무 작아 깨지지 않는지 검수한다.
 * (가) 로고 위주 입력 전제 — 검출된 로고 bbox 최대변을 프레임 최대변 대비 비율로 본다.
 * 절대 px "깨짐" 판정은 원본 해상도가 필요해 후속 정교화로 남기고, 지금은 프레임 상대 비율로 근사.
 */
export const relativeSizeChecker: AlgorithmChecker = ({ grid }) => {
	if (!grid) return { status: 'fail', fulfillment: null, detail: 'grid 없음' }
	const region = detectLogoRegion(grid)
	if (!region) return { status: 'fail', fulfillment: 0, detail: '로고 영역 검출 실패' }

	const { bbox } = region
	const longSide = Math.max(bbox.x1 - bbox.x0 + 1, bbox.y1 - bbox.y0 + 1)
	const imgLong = Math.max(region.width, region.height)
	const frac = imgLong === 0 ? 0 : longSide / imgLong

	return {
		status: frac >= MIN_FRACTION ? 'pass' : 'fail',
		fulfillment: Math.round(Math.min(frac / MIN_FRACTION, 1) * 1000) / 10,
		detail: `로고 최대변 ${(frac * 100).toFixed(0)}% / 최소 ${MIN_FRACTION * 100}% (프레임 대비, 러프)`,
		metric: {
			expected: `${MIN_FRACTION * 100}%`,
			actual: `${(frac * 100).toFixed(0)}%`,
		},
	}
}
