import { getChecker } from '@/features/review/checkers/registry'
import type { RuleCheckResult } from '@/features/review/checkers/types'
import { extractPixels } from '@/repositories/image-pixels.repository'

export interface ReviewTargetRule {
	key: string
	tier: string
}

/**
 * 검수 대상 이미지를 룰 목록에 비춰 룰별 결과를 만든다.
 * checker가 있는 룰만 실제 판정하고, 없으면 unsupported(또는 manual tier는 manual)로 둔다.
 * 이미지 디코딩은 repository가, 룰 계산은 각 checker가 소유한다.
 */
export async function runReviewService(
	buffer: Buffer,
	rules: ReviewTargetRule[],
): Promise<RuleCheckResult[]> {
	const pixels = await extractPixels(buffer)

	return rules.map((rule) => {
		const checker = getChecker(rule.key)
		if (!checker) {
			return {
				ruleKey: rule.key,
				tier: rule.tier,
				status: rule.tier === 'manual' ? 'manual' : 'unsupported',
				fulfillment: null,
				detail: '',
			}
		}
		return { ruleKey: rule.key, tier: rule.tier, ...checker.check({ pixels }) }
	})
}
