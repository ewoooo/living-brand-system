/**
 * Checker: 프레임(grid) 종횡비가 허용 포맷 목록 중 하나와 맞는지 판정한다.
 * 알고리즘은 이 파일 하나가 소유하고, 허용 포맷은 Check options로 받는다.
 */
import type { AlgorithmChecker, AlgorithmCheckResult } from './types'

export interface CanvasFormat {
	label: string
	width: number
	height: number
}

export interface CanvasFormatOptions {
	/** 허용 비율 편차. 캔버스는 규격 px로 내보내는 게 정상이라 기본은 좁게 본다. (knob — A4 0.707 vs 3:5 0.75 구분 유지 한계 ~3%) */
	tolerance?: number
	/** 가로/세로 방향을 무시하고 긴변/짧은변 비율로 비교한다 (회전 자유인 인쇄 규격용). */
	ignoreOrientation?: boolean
}

/** 허용 포맷 중 가장 가까운 것과의 비율 편차로 pass/fail을 정한다. */
export function makeCanvasFormatChecker(
	formats: CanvasFormat[],
	{ tolerance = 0.02, ignoreOrientation = false }: CanvasFormatOptions = {},
): AlgorithmChecker {
	const ratioOf = (width: number, height: number) =>
		ignoreOrientation ? Math.max(width, height) / Math.min(width, height) : width / height
	return ({ grid }): AlgorithmCheckResult => {
		if (!grid) return { status: 'fail', fulfillment: null, detail: 'grid 없음' }
		const aspect = ratioOf(grid.width, grid.height)
		let best = formats[0]
		let bestDiff = Number.POSITIVE_INFINITY
		for (const format of formats) {
			const target = ratioOf(format.width, format.height)
			const diff = Math.abs(aspect - target) / target
			if (diff < bestDiff) {
				bestDiff = diff
				best = format
			}
		}
		const ok = bestDiff <= tolerance
		return {
			status: ok ? 'pass' : 'fail',
			fulfillment: Math.round(Math.max(0, 1 - bestDiff) * 1000) / 10,
			detail: `${grid.width}×${grid.height}px — 최근접 규격 ${best.label} 편차 ${(bestDiff * 100).toFixed(1)}% (허용 ${tolerance * 100}%)`,
			metric: {
				expected: `${best.label} (±${tolerance * 100}%)`,
				actual: `${grid.width}×${grid.height}px`,
			},
			facts: {
				allowedFormats: formats.map((format) => format.label),
				closestFormat: best.label,
			},
		}
	}
}
