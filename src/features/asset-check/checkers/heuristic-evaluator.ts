import { z } from 'zod'
import type { AiCheckResult } from './types'

export const heuristicObservationSchema = z.strictObject({
	value: z.enum(['present', 'absent', 'uncertain']),
	confidence: z.number().min(0).max(100),
	reason: z.string().min(1).max(300),
})

/** AI 관측값을 Check 기준과 비교해 최종 상태를 결정한다. */
export function evaluateHeuristic(
	criteria: readonly {
		id: string
		question: string
		expected: 'present' | 'absent'
	}[],
	observations: Record<string, z.infer<typeof heuristicObservationSchema>> | undefined,
): AiCheckResult {
	if (criteria.length === 0) return needsReview('판정 기준 없음', 'invalid_criteria')
	if (!observations) return needsReview('AI 관측 결과 없음', 'ai_output_invalid')

	const comparisons = criteria.map((criterion) => {
		const observation = observations[criterion.id]
		if (!observation) return null
		return {
			criterionId: criterion.id,
			question: criterion.question,
			expected: criterion.expected,
			actual: observation.value,
			confidence: observation.confidence,
			reason: observation.reason,
			satisfied:
				observation.value === 'uncertain' ? null : observation.value === criterion.expected,
		}
	})
	if (comparisons.some((comparison) => comparison === null)) {
		return needsReview('AI 관측 결과 누락', 'ai_output_invalid')
	}

	const complete = comparisons.filter((comparison) => comparison !== null)
	const failed = complete.filter((comparison) => comparison.satisfied === false).length
	const uncertain = complete.filter((comparison) => comparison.satisfied === null).length
	const status = failed > 0 ? 'fail' : uncertain > 0 ? 'needs_review' : 'pass'

	return {
		status,
		fulfillment: null,
		detail:
			status === 'fail'
				? `기준 ${failed}개 미충족`
				: status === 'needs_review'
					? `기준 ${uncertain}개 판단 필요`
					: `기준 ${complete.length}개 충족`,
		observations: complete,
	}
}

function needsReview(detail: string, reasonCode: string): AiCheckResult {
	return { status: 'needs_review', fulfillment: null, detail, reasonCode }
}

/** AI 조언 문단을 advisory 결과로 감싼다. 조언만 싣고 판정은 만들지 않는다. */
export function evaluateAdvisory(advice: string | undefined): AiCheckResult {
	const trimmed = advice?.trim()
	if (!trimmed) return needsReview('AI 조언 없음', 'ai_output_invalid')
	return { status: 'advisory', fulfillment: null, detail: trimmed }
}
