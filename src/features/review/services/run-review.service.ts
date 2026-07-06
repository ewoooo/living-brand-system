import type { Rgb } from '@/features/review/checkers/color/color-check'
import { shouldCheckRule } from '@/features/review/checkers/content-gate'
import { getChecker } from '@/features/review/checkers/registry'
import type { CheckResult, PixelGrid } from '@/features/review/checkers/types'
import { extractPixelGrid } from '@/features/review/repositories/image-pixels.sharp.repository'
import { getReviewPalette } from '@/features/review/services/get-review-palette.service'
import {
	getReviewRuleset,
	type ReviewSection,
} from '@/features/review/services/get-review-ruleset.service'
import type { ImageContentFlags } from '@/features/review/types/content-flags'

/** grid에서 color 검수용 flat 픽셀(불투명)을 파생한다. */
function opaquePixels(grid: PixelGrid): Rgb[] {
	const out: Rgb[] = []
	for (let i = 0; i < grid.pixels.length; i++) {
		if (grid.alpha[i] > 0) out.push(grid.pixels[i])
	}
	return out
}

/**
 * 검수 대상 이미지를 룰셋에 비춰 checker가 있는 룰만 판정한다 (서버 확정 판정의 단일 소스).
 * 요소 종속 룰(logo 등)은 포함 요소 플래그가 켜진 것만 검수한다 (content-gate 소유).
 * 이미지 디코딩은 image-pixels repository가, 기준 조회는 review service/repository가 소유한다.
 */
export async function runReviewService(
	buffer: Buffer,
	flags: ImageContentFlags,
	inputSections?: ReviewSection[],
): Promise<Record<string, CheckResult>> {
	const [grid, sections, palette] = await Promise.all([
		extractPixelGrid(buffer),
		inputSections ?? getReviewRuleset(),
		getReviewPalette(),
	])
	const pixels = opaquePixels(grid)

	const results: Record<string, CheckResult> = {}
	for (const section of sections) {
		for (const rule of section.rules) {
			if (results[rule.key] || !shouldCheckRule(rule.key, flags)) continue
			const checker = getChecker(rule.key)
			if (!checker) continue
			results[rule.key] = checker.check({ pixels, palette, grid })
		}
	}

	return results
}
