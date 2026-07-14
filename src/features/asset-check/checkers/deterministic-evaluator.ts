import type {
	CriterionComparison,
	CriterionExpected,
	DeterministicChecker,
	DeterministicCriterion,
	DeterministicEvaluationResult,
	ExtractionResult,
	MeasurementResult,
	MeasurementValue,
} from './types'

/** 측정값을 Check criteria와 비교해 deterministic 상태와 충족도를 계산한다. */
export function evaluateMeasurement(
	result: MeasurementResult,
	criteria: readonly DeterministicCriterion[],
): DeterministicEvaluationResult {
	if (result.state === 'not_measurable') {
		return {
			status: 'needs_review',
			fulfillment: null,
			comparisons: [],
			facts: result.facts,
			reasonCode: result.reasonCode,
		}
	}
	if (criteria.length === 0) return needsReview(result, 'invalid_criteria')

	const comparisons: CriterionComparison[] = []
	for (const criterion of criteria) {
		const actual = result.measurements[criterion.measurement]
		if (actual === undefined) return needsReview(result, 'missing_measurement')
		const satisfied = compare(
			actual,
			criterion.expected,
			criterion.operator,
			criterion.tolerance,
		)
		if (satisfied === undefined) return needsReview(result, 'invalid_criteria')
		comparisons.push({ ...criterion, actual, satisfied })
	}

	const satisfiedCount = comparisons.filter((comparison) => comparison.satisfied).length
	return {
		status: satisfiedCount === comparisons.length ? 'pass' : 'fail',
		fulfillment: Math.round((satisfiedCount / comparisons.length) * 1000) / 10,
		comparisons,
		measurements: result.measurements,
		facts: result.facts,
	}
}

/** Extractor 결과를 Checker 측정과 Evaluator 판정으로 연결한다. */
export function evaluateExtraction<Input>(
	extraction: ExtractionResult<Input>,
	checker: DeterministicChecker<Input>,
	criteria: readonly DeterministicCriterion[],
	parameters?: Record<string, unknown>,
): DeterministicEvaluationResult {
	const measurement: MeasurementResult =
		extraction.state === 'extracted'
			? checker(extraction.value, parameters)
			: { state: 'not_measurable', reasonCode: extraction.reasonCode }
	return evaluateMeasurement(measurement, criteria)
}

function needsReview(
	result: Extract<MeasurementResult, { state: 'measured' }>,
	reasonCode: string,
): DeterministicEvaluationResult {
	return {
		status: 'needs_review',
		fulfillment: null,
		comparisons: [],
		measurements: result.measurements,
		facts: result.facts,
		reasonCode,
	}
}

function compare(
	actual: MeasurementValue,
	expected: CriterionExpected,
	operator: DeterministicCriterion['operator'],
	tolerance?: number,
): boolean | undefined {
	switch (operator) {
		case 'gte':
			return typeof actual === 'number' && typeof expected === 'number'
				? actual >= expected
				: undefined
		case 'lte':
			return typeof actual === 'number' && typeof expected === 'number'
				? actual <= expected
				: undefined
		case 'eq':
			return Array.isArray(expected) || typeof actual !== typeof expected
				? undefined
				: actual === expected
		case 'in':
			return Array.isArray(expected) ? expected.some((value) => value === actual) : undefined
		case 'within': {
			if (typeof actual !== 'number' || tolerance === undefined || tolerance < 0)
				return undefined
			const targets = typeof expected === 'number' ? [expected] : expected
			return Array.isArray(targets) && targets.every((value) => typeof value === 'number')
				? targets.some((value) => Math.abs(actual - value) <= tolerance)
				: undefined
		}
	}
}
