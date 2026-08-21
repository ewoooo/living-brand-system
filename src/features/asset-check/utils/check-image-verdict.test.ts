import { describe, expect, it } from 'vitest'
import type { AiCheckResult, CheckResult } from '@/features/asset-check/checkers/types'
import type { CheckImage } from '@/features/asset-check/types'
import {
	checkImageVerdict,
	formatConfidence,
	ruleConfidence,
} from '@/features/asset-check/utils/check-image-verdict'

describe('checkImageVerdict', () => {
	it('reports progress before any judgement', () => {
		expect(checkImageVerdict(image({}, 'running'))).toBe('running')
		expect(checkImageVerdict(image({}, 'failed'))).toBe('failed')
		expect(checkImageVerdict(image({}, 'idle'))).toBe('idle')
	})

	it('keeps running ahead of partial results', () => {
		expect(checkImageVerdict(image({ a: result('a', 'fail') }, 'running'))).toBe('running')
	})

	it('stays idle when a completed image carries no result', () => {
		expect(checkImageVerdict(image({}, 'completed'))).toBe('idle')
	})

	it('folds rule results worst-first', () => {
		expect(checkImageVerdict(image({ a: result('a', 'pass'), b: result('b', 'pass') }))).toBe(
			'pass',
		)
		expect(
			checkImageVerdict(image({ a: result('a', 'pass'), b: result('b', 'advisory') })),
		).toBe('advisory')
		expect(
			checkImageVerdict(
				image({ a: result('a', 'advisory'), b: result('b', 'needs_review') }),
			),
		).toBe('needs_review')
		expect(
			checkImageVerdict(image({ a: result('a', 'needs_review'), b: result('b', 'fail') })),
		).toBe('fail')
	})

	it('folds not_applicable and ok into pass', () => {
		const notApplicable = result('a', 'pass')
		notApplicable.rawResult.reasonCode = 'not_applicable'

		expect(checkImageVerdict(image({ a: notApplicable, b: result('b', 'ok') }))).toBe('pass')
		expect(checkImageVerdict(image({ a: notApplicable, b: result('b', 'fail') }))).toBe('fail')
	})
})

describe('ruleConfidence', () => {
	it('takes the weakest observation', () => {
		expect(ruleConfidence(aiResult([90, 75, 82]))).toBe(75)
	})

	it('returns null when the rule has no observation', () => {
		expect(ruleConfidence(result('a', 'pass'))).toBeNull()
		expect(ruleConfidence(aiResult([]))).toBeNull()
	})
})

function image(
	results: NonNullable<CheckImage['results']>,
	status: CheckImage['status'] = 'completed',
): CheckImage {
	return {
		id: 'image-1',
		url: 'blob:test',
		name: 'test.png',
		file: {} as File,
		scenarioKey: 'quick',
		status,
		results,
	}
}

function result(key: string, status: CheckResult['rawResult']['status']): CheckResult {
	return {
		rule: { key, title: key, executor: 'deterministic' },
		checker: { key, type: 'algorithm' },
		rawResult: { status, fulfillment: null, detail: status },
	}
}

function aiResult(confidences: number[]): CheckResult {
	const observations: AiCheckResult['observations'] = confidences.map((confidence, index) => ({
		criterionId: `c-${index}`,
		question: `question ${index}`,
		expected: 'present',
		actual: 'present',
		confidence,
		reason: 'reason',
		satisfied: true,
	}))

	return {
		rule: { key: 'ai.rule', title: 'ai.rule', executor: 'heuristic' },
		checker: { key: 'ai', type: 'ai' },
		rawResult: { status: 'pass', fulfillment: null, observations },
	}
}

describe('formatConfidence', () => {
	// 🔴 confidence는 이미 0~100이다(ai-observation-task의 프롬프트 계약). 0~1로 보고 100을 곱하면
	//    요약·근거 화면에 5800%가 찍힌다 — 실제로 그렇게 나갔던 회귀다.
	it('0~100 정수를 그대로 백분율로 쓴다', () => {
		expect(formatConfidence(58)).toBe('58%')
		expect(formatConfidence(100)).toBe('100%')
		expect(formatConfidence(0)).toBe('0%')
	})

	it('소수점은 반올림한다', () => {
		expect(formatConfidence(74.5)).toBe('75%')
	})
})
