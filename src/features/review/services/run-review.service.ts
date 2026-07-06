import { opaquePixels } from '@/features/review/checkers/color/color-metrics'
import { shouldCheckRule } from '@/features/review/checkers/content-gate'
import { getChecker } from '@/features/review/checkers/registry'
import type { CheckerContext, CheckResult } from '@/features/review/checkers/types'
import { extractPixelGrid } from '@/features/review/repositories/image-decoder.sharp.repository'
import { runAiReview } from '@/features/review/services/ai-review.service'
import { getReviewPalette } from '@/features/review/services/get-review-palette.service'
import {
	getReviewRules,
	type ReviewRule,
} from '@/features/review/services/get-review-ruleset.service'
import type { ImageContentFlags } from '@/features/review/types/content-flags'

/**
 * 검수 대상 이미지를 룰셋에 비춰 checker가 있는 룰만 판정한다 (서버 확정 판정의 단일 소스).
 * 요소 종속 룰(logo 등)은 포함 요소 플래그가 켜진 것만 검수한다 (content-gate 소유).
 * 이미지 디코딩은 image-decoder repository가, 기준 조회는 review service/repository가 소유한다.
 */
export async function runReviewService(
	buffer: Buffer,
	flags: ImageContentFlags,
	inputRules?: ReviewRule[],
): Promise<Record<string, CheckResult>> {
	const [grid, rules, palette] = await Promise.all([
		extractPixelGrid(buffer),
		inputRules ?? getReviewRules(),
		getReviewPalette(),
	])
	const pixels = opaquePixels(grid)
	const image = imageInputFrom(buffer)

	const results: Record<string, CheckResult> = {}
	const heuristicRules: ReviewRule[] = []
	const ctx = { pixels, palette, grid, image }
	for (const rule of rules) {
		if (results[rule.key] || !shouldCheckRule(rule.key, flags)) continue
		if (rule.executor === 'heuristic') {
			heuristicRules.push(rule)
			continue
		}
		const result = runRuleByExecutor(rule, ctx)
		if (result) results[rule.key] = result
	}
	if (heuristicRules.length > 0) {
		Object.assign(results, await runAiReview(heuristicRules, ctx))
	}

	return results
}

function runRuleByExecutor(rule: ReviewRule, ctx: CheckerContext): CheckResult | null {
	switch (rule.executor) {
		case 'deterministic': {
			const checker = getChecker(rule.key)
			return checker ? checker.check(ctx) : null
		}
		case 'heuristic':
			return null
		case 'advisory':
			return {
				status: 'needs_review',
				fulfillment: null,
				detail: '브랜드 담당자 확인 필요',
			}
	}
}

function imageInputFrom(buffer: Buffer): CheckerContext['image'] {
	if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
		return { data: buffer, mediaType: 'image/jpeg' }
	}
	if (
		buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
	) {
		return { data: buffer, mediaType: 'image/png' }
	}
	if (
		buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
		buffer.subarray(8, 12).toString('ascii') === 'WEBP'
	) {
		return { data: buffer, mediaType: 'image/webp' }
	}
}
