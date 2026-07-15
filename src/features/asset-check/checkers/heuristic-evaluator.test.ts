import { describe, expect, it } from 'vitest'
import { evaluateHeuristic } from './heuristic-evaluator'

const criteria = [
	{ id: 'redness', question: '인위적인 홍조가 있는가?', expected: 'absent' as const },
	{ id: 'texture', question: '자연스러운 피부 질감인가?', expected: 'present' as const },
]

describe('evaluateHeuristic', () => {
	it('관측값과 기준값을 코드로 비교해 상태를 결정한다', () => {
		const pass = evaluateHeuristic(criteria, {
			redness: { value: 'absent', confidence: 90, reason: '홍조 없음' },
			texture: { value: 'present', confidence: 85, reason: '피부 질감 확인' },
		})
		const fail = evaluateHeuristic(criteria, {
			redness: { value: 'present', confidence: 90, reason: '홍조 확인' },
			texture: { value: 'present', confidence: 85, reason: '피부 질감 확인' },
		})
		const review = evaluateHeuristic(criteria, {
			redness: { value: 'uncertain', confidence: 50, reason: '조명과 구분 어려움' },
			texture: { value: 'present', confidence: 85, reason: '피부 질감 확인' },
		})

		expect(pass.status).toBe('pass')
		expect(fail.status).toBe('fail')
		expect(fail.observations?.[0]?.satisfied).toBe(false)
		expect(review.status).toBe('needs_review')
		expect(review.observations?.[0]?.satisfied).toBeNull()
	})

	it('기준이나 관측값이 누락되면 검토로 닫는다', () => {
		expect(evaluateHeuristic([], {}).reasonCode).toBe('invalid_criteria')
		expect(evaluateHeuristic(criteria, undefined).reasonCode).toBe('ai_output_invalid')
		expect(
			evaluateHeuristic(criteria, {
				redness: { value: 'absent', confidence: 90, reason: '홍조 없음' },
			}).reasonCode,
		).toBe('ai_output_invalid')
	})
})
