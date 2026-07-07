/**
 * Checker: 팔레트 안 색들의 조합 가능성을 본다.
 * ruleKey는 `color.combination`, 파일명은 색상 조합 판정 기능을 따른다.
 */
import type { AlgorithmChecker } from '../types'
import { contrastRatio, dominantColors } from './color-metrics'
import { nearestSwatch, PALETTE_DELTA_E_TOLERANCE } from './palette-match'

// 다계열(톤인톤) 근사 시 요구하는 최소 명도 대비 (러프 knob — 방향성 테이블 정교화 전까지).
const TONE_IN_TONE_MIN_CONTRAST = 1.5

/**
 * color.combination: 색 "조합"이 허용되는지 판정한다.
 * palette(개별 색이 팔레트 안인가)를 전제로만 성립 — 팔레트 밖 색이 있으면 조합 평가 불가로 fail.
 * 모든 색이 팔레트 안일 때: 단일 유채계열(+극단색)=모노/톤온톤으로 유효, 다계열=톤인톤 근사(명도 대비).
 * 방향성(배경톤→전경톤) 풀 테이블은 fg/bg 추정이 필요해 후속 정교화로 남긴다.
 */
export const colorCombinationChecker: AlgorithmChecker = ({ pixels, palette }) => {
	if (pixels.length === 0) return { status: 'fail', fulfillment: 0, detail: '픽셀 없음' }
	if (palette.length === 0) return { status: 'fail', fulfillment: 0, detail: '팔레트 없음' }
	const dom = dominantColors(pixels, 8, 0.02)
	if (dom.length === 0) return { status: 'fail', fulfillment: 0, detail: '지배색 없음' }

	const snapped = dom.map((c) => ({ ...c, match: nearestSwatch(c.rgb, palette) }))
	// palette 게이트: 하나라도 팔레트 밖이면 조합을 논할 수 없다.
	if (snapped.some((s) => s.match.distance > PALETTE_DELTA_E_TOLERANCE)) {
		return {
			status: 'fail',
			fulfillment: null,
			detail: '팔레트 외 색 존재 — 조합 평가 불가 (palette 선행)',
		}
	}

	const chromatic = snapped.filter(
		(s) => s.match.swatch.family !== 'extreme' && s.match.swatch.family !== 'gray',
	)
	const families = new Set(chromatic.map((s) => s.match.swatch.family))

	if (families.size <= 1) {
		return {
			status: 'pass',
			fulfillment: 100,
			detail:
				families.size === 0
					? '무채/극단색만 — 유효'
					: `단일 계열(${[...families][0]}) 모노/톤온톤 — 유효`,
		}
	}

	// 다계열 = 톤인톤. 러프 근사: 상위 두 유채색의 명도 대비로 판정.
	const top = [...chromatic].sort((a, b) => b.share - a.share)
	const cr = contrastRatio(top[0].rgb, top[1].rgb)
	const ok = cr >= TONE_IN_TONE_MIN_CONTRAST
	return {
		status: ok ? 'pass' : 'fail',
		fulfillment: ok ? 100 : 0,
		detail: `다계열 톤인톤 근사: 대비 ${cr.toFixed(2)} ${ok ? '충분' : '부족'} (러프)`,
		metric: {
			expected: `${TONE_IN_TONE_MIN_CONTRAST.toFixed(1)} 이상`,
			actual: cr.toFixed(2),
		},
	}
}
