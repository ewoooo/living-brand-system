import { z } from 'zod'
import type { AiCheckResult, HeuristicCriterion } from './types'

export const presenceObservationSchema = z.strictObject({
	value: z.enum(['present', 'absent', 'uncertain', 'not_applicable']),
	confidence: z.number().min(0).max(100),
	reason: z.string().min(1).max(300),
})

export const measureObservationSchema = z.strictObject({
	value: z.union([z.number(), z.enum(['uncertain', 'not_applicable'])]),
	confidence: z.number().min(0).max(100),
	reason: z.string().min(1).max(300),
})

export type HeuristicObservation =
	| z.infer<typeof presenceObservationSchema>
	| z.infer<typeof measureObservationSchema>

/** AI 관측값을 Check 기준과 비교해 최종 상태를 결정한다. kind와 무관하게 compare 한 곳에서 판정한다. */
export function evaluateHeuristic(
	criteria: readonly HeuristicCriterion[],
	observations: Record<string, HeuristicObservation> | undefined,
): AiCheckResult {
	if (criteria.length === 0) return needsReview('판정 기준 없음', 'invalid_criteria')
	if (!observations) return needsReview('AI 관측 결과 없음', 'ai_output_invalid')

	const comparisons = criteria.map((criterion) => {
		const observation = observations[criterion.id]
		if (!observation) return null
		return {
			criterionId: criterion.id,
			question: criterion.question,
			kind: criterion.kind ?? 'presence',
			expected: criterion.expected,
			operator: criterion.kind === 'measure' ? criterion.operator : undefined,
			max: criterion.kind === 'measure' ? criterion.max : undefined,
			unit: criterion.kind === 'measure' ? criterion.unit : undefined,
			actual: observation.value,
			confidence: observation.confidence,
			reason: observation.reason,
			satisfied:
				observation.value === 'uncertain' || observation.value === 'not_applicable'
					? null
					: compare(criterion, observation.value),
		}
	})
	if (comparisons.some((comparison) => comparison === null)) {
		return needsReview('AI 관측 결과 누락', 'ai_output_invalid')
	}

	const complete = comparisons.filter((comparison) => comparison !== null)
	const applicable = complete.filter((comparison) => comparison.actual !== 'not_applicable')
	if (applicable.length === 0) {
		return {
			status: 'pass',
			fulfillment: null,
			detail: '관측 대상 없음',
			reasonCode: 'not_applicable',
			observations: complete,
		}
	}

	const failed = applicable.filter((comparison) => comparison.satisfied === false).length
	const uncertain = applicable.filter((comparison) => comparison.satisfied === null).length
	const satisfied = applicable.filter((comparison) => comparison.satisfied === true).length
	const status = failed > 0 ? 'fail' : uncertain > 0 ? 'needs_review' : 'pass'

	return {
		status,
		fulfillment: Math.round((satisfied / applicable.length) * 100),
		detail:
			status === 'fail'
				? `기준 ${failed}개 미충족`
				: status === 'needs_review'
					? `기준 ${uncertain}개 판단 필요`
					: `기준 ${applicable.length}개 충족`,
		observations: complete,
	}
}

/** kind별 관측값-기준 비교. 관측값 타입이 기준과 어긋나면 판정 불가(null)로 남긴다. */
function compare(
	criterion: HeuristicCriterion,
	value: 'present' | 'absent' | number,
): boolean | null {
	if (criterion.kind === 'measure') {
		if (typeof value !== 'number') return null
		if (criterion.operator === 'gte') return value >= criterion.expected
		if (criterion.operator === 'lte') return value <= criterion.expected
		return value >= criterion.expected && value <= (criterion.max ?? criterion.expected)
	}
	return typeof value === 'number' ? null : value === criterion.expected
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
