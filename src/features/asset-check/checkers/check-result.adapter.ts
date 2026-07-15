import type {
	AlgorithmCheckResult,
	CheckExecutor,
	CheckResult,
	CheckResultChecker,
	CheckStatus,
	DeterministicEvaluationResult,
	RawCheckResult,
} from './types'

interface CheckResultRuleInput {
	key: string
	title: string
	executor: CheckExecutor
	messages?: Partial<Record<CheckStatus, string>>
}

/** 정규화된 deterministic 평가를 기존 CheckResult 저장·표시 계약으로 변환한다. */
export function toDeterministicCheckResult(
	evaluation: DeterministicEvaluationResult,
	check: CheckResultRuleInput,
	checkerKey: string,
): CheckResult {
	const satisfiedCount = evaluation.comparisons.filter(
		(comparison) => comparison.satisfied,
	).length
	const firstComparison = evaluation.comparisons[0]
	const rawResult: AlgorithmCheckResult = {
		status: evaluation.status,
		fulfillment: evaluation.fulfillment,
		detail:
			evaluation.status === 'needs_review'
				? '자동 측정 불가'
				: `기준 ${satisfiedCount}/${evaluation.comparisons.length}개 충족`,
		facts: evaluation.facts,
		measurements: evaluation.measurements,
		comparisons: evaluation.comparisons,
		reasonCode: evaluation.reasonCode,
		metric: firstComparison
			? {
					expected: formatValue(firstComparison.expected),
					actual: formatValue(firstComparison.actual),
				}
			: undefined,
	}

	return toCheckResult(rawResult, check, { key: checkerKey, type: 'algorithm' })
}

/** 실행기 원본 결과에 Check와 Checker 식별자, 사용자 메시지를 붙인다. */
export function toCheckResult(
	rawResult: RawCheckResult,
	check: CheckResultRuleInput | undefined,
	checker: CheckResultChecker,
): CheckResult {
	return {
		rule: {
			key: check?.key ?? checker.key,
			title: check?.title ?? checker.key,
			executor: check?.executor ?? (checker.type === 'ai' ? 'heuristic' : 'deterministic'),
		},
		checker,
		rawResult,
		message: renderCheckMessage(check?.messages?.[rawResult.status], rawResult),
	}
}

function renderCheckMessage(pattern: string | undefined, result: RawCheckResult): string {
	if (!pattern) return result.detail
	return pattern.replace(/\{([^}]+)\}/g, (_match, path: string) =>
		String(readPath(result, path.trim()) ?? ''),
	)
}

function readPath(value: unknown, path: string): unknown {
	return path.split('.').reduce<unknown>((current, key) => {
		if (!current || typeof current !== 'object') return undefined
		const next = (current as Record<string, unknown>)[key]
		return Array.isArray(next) ? next.join(', ') : next
	}, value)
}

function formatValue(value: unknown): string {
	return Array.isArray(value) ? value.join(', ') : String(value)
}
