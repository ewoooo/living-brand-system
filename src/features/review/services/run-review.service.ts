import { getChecker } from '@/features/review/checkers/registry'
import type { PixelGrid, RuleMetric } from '@/features/review/checkers/types'
import type { Rgb } from '@/features/review/color-check'
import { extractPixelGrid } from '@/features/review/repositories/image-pixels.sharp.repository'
import { getReviewRuleset } from '@/features/review/services/get-review-ruleset.service'

/** 룰 하나의 서버 확정 판정 — route 응답이자 클라이언트 표시 계약. */
export interface RuleOutcome {
	status: 'pass' | 'fail'
	fulfillment: number | null
	detail: string
	/** 코멘터리 주입용 기준/현재값 (계산된 룰만) */
	metric?: RuleMetric
}

/** grid에서 color 검수용 flat 픽셀(불투명)을 파생한다. */
function opaquePixels(grid: PixelGrid): Rgb[] {
	const out: Rgb[] = []
	for (let i = 0; i < grid.pixels.length; i++) {
		if (grid.alpha[i] > 0) out.push(grid.pixels[i])
	}
	return out
}

/**
 * 검수 대상 이미지를 룰셋 전체에 비춰 checker가 있는 룰만 판정한다 (서버 확정 판정의 단일 소스).
 * 이미지 디코딩은 image-pixels repository가, 룰셋 조회는 get-review-ruleset service가 소유한다.
 */
export async function runReviewService(buffer: Buffer): Promise<Record<string, RuleOutcome>> {
	const [grid, sections] = await Promise.all([extractPixelGrid(buffer), getReviewRuleset()])
	const pixels = opaquePixels(grid)

	const results: Record<string, RuleOutcome> = {}
	for (const section of sections) {
		for (const rule of section.rules) {
			if (results[rule.key]) continue
			const checker = getChecker(rule.key)
			if (!checker) continue
			const result = checker.check({ pixels, grid })
			results[rule.key] = {
				status: result.status,
				fulfillment: result.fulfillment,
				detail: result.detail,
				metric: result.metric,
			}
		}
	}

	return results
}
