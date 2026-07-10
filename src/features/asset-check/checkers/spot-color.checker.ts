/**
 * Checker: 제한된 별색/부분 팔레트 사용 여부를 본다.
 * checkKey는 `application.print.spec`, 파일명은 Red+White 별색 1도 근사 판정 기능을 따른다.
 */

import { dominantColors } from './color-metrics'
import { nearestSwatch, PALETTE_DELTA_E_TOLERANCE } from './palette-match'
import type { AlgorithmChecker } from './types'

// 명함은 별색 1도(Pantone Warm Red = Essenherb Red) 인쇄 → 실제 구성이 Essenherb Red + White 뿐이어야 한다.
const STATIONERY_ALLOWED_HEX = new Set(['FFFFFF', 'EA5343'])
const MAX_OFF_SHARE = 0.05

/**
 * application.print.spec: 명함 별색 1도 규정을 픽셀 프록시로 검수한다 (Stationary 섹션).
 * 파일 색모드(별색) 메타 없이 렌더 이미지만으로 근사 — 지배색이 Essenherb Red + White로만 구성됐는지 본다.
 * 팔레트 안이어도(예: 다른 톤) 명함에선 이 2색 외는 위반. color.palette보다 엄격한 부분집합 검수.
 */
export const spotColorChecker: AlgorithmChecker = ({ pixels, palette }) => {
	if (pixels.length === 0) return { status: 'fail', fulfillment: 0, detail: '픽셀 없음' }
	const allowed = palette.filter((s) =>
		STATIONERY_ALLOWED_HEX.has(s.hex.replace(/^#/, '').toUpperCase()),
	)
	if (allowed.length === 0) return { status: 'fail', fulfillment: 0, detail: '팔레트 없음' }
	const dom = dominantColors(pixels, 12, 0.01)
	if (dom.length === 0) return { status: 'fail', fulfillment: 0, detail: '지배색 없음' }

	let off = 0
	for (const c of dom) {
		if (nearestSwatch(c.rgb, allowed).distance > PALETTE_DELTA_E_TOLERANCE) off += c.share
	}
	const total = dom.reduce((sum, c) => sum + c.share, 0)
	const ratio = total === 0 ? 0 : off / total

	return {
		status: ratio <= MAX_OFF_SHARE ? 'pass' : 'fail',
		fulfillment: Math.round((1 - ratio) * 1000) / 10,
		detail: `Red+White 외 색 ${Math.round(ratio * 100)}% (별색 1도, 허용 ${MAX_OFF_SHARE * 100}%)`,
		metric: {
			expected: `${MAX_OFF_SHARE * 100}% 이내`,
			actual: `${Math.round(ratio * 100)}%`,
		},
	}
}
