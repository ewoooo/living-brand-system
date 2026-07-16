import { describe, expect, it } from 'vitest'
import { evaluateAdvisory, evaluateHeuristic } from './heuristic.evaluator'

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

const measureCriteria = [
	{
		id: 'logo-area',
		question: '로고가 캔버스에서 차지하는 면적 비율(%)은?',
		kind: 'measure' as const,
		operator: 'between' as const,
		expected: 5,
		max: 30,
		unit: '%',
	},
	{
		id: 'aspect',
		question: '캔버스의 가로/세로 비율은?',
		kind: 'measure' as const,
		operator: 'gte' as const,
		expected: 0.7,
	},
]

describe('evaluateHeuristic - measure', () => {
	it('수치 관측값을 연산 기준으로 비교한다', () => {
		const pass = evaluateHeuristic(measureCriteria, {
			'logo-area': { value: 12, confidence: 80, reason: '로고 점유율 약 12%' },
			aspect: { value: 0.75, confidence: 90, reason: '3:4 비율' },
		})
		const fail = evaluateHeuristic(measureCriteria, {
			'logo-area': { value: 45, confidence: 85, reason: '로고가 과도하게 큼' },
			aspect: { value: 0.75, confidence: 90, reason: '3:4 비율' },
		})

		expect(pass.status).toBe('pass')
		expect(pass.fulfillment).toBe(100)
		expect(fail.status).toBe('fail')
		expect(fail.observations?.[0]?.satisfied).toBe(false)
		expect(fail.observations?.[0]?.actual).toBe(45)
		expect(fail.fulfillment).toBe(50)
	})

	it('lte 연산과 between 하한도 비교한다', () => {
		const lteCriterion = [
			{
				id: 'text-count',
				question: '시그니처 문구 개수는?',
				kind: 'measure' as const,
				operator: 'lte' as const,
				expected: 1,
				unit: '개',
			},
		]
		expect(
			evaluateHeuristic(lteCriterion, {
				'text-count': { value: 1, confidence: 90, reason: '1개' },
			}).status,
		).toBe('pass')
		expect(
			evaluateHeuristic(lteCriterion, {
				'text-count': { value: 3, confidence: 90, reason: '3개' },
			}).status,
		).toBe('fail')
		expect(
			evaluateHeuristic(measureCriteria.slice(0, 1), {
				'logo-area': { value: 3, confidence: 90, reason: '5% 미만' },
			}).status,
		).toBe('fail')
	})

	it('수치형에 숫자가 아닌 관측이 오면 판단 필요로 남긴다', () => {
		const review = evaluateHeuristic(measureCriteria.slice(0, 1), {
			'logo-area': { value: 'uncertain', confidence: 40, reason: '경계 불명확' },
		})
		expect(review.status).toBe('needs_review')
		expect(review.observations?.[0]?.satisfied).toBeNull()
	})
})

describe('evaluateHeuristic - not_applicable', () => {
	it('N/A는 분모에서 제외하고 나머지로 판정한다', () => {
		const result = evaluateHeuristic(criteria, {
			redness: { value: 'not_applicable', confidence: 95, reason: '피부가 없는 이미지' },
			texture: { value: 'present', confidence: 85, reason: '피부 질감 확인' },
		})
		expect(result.status).toBe('pass')
		expect(result.fulfillment).toBe(100)
		expect(result.observations?.[0]?.satisfied).toBeNull()
	})

	it('모든 기준이 N/A면 관측 대상 없음 pass로 닫는다', () => {
		const result = evaluateHeuristic(criteria, {
			redness: { value: 'not_applicable', confidence: 95, reason: '피부 없음' },
			texture: { value: 'not_applicable', confidence: 95, reason: '피부 없음' },
		})
		expect(result.status).toBe('pass')
		expect(result.detail).toBe('관측 대상 없음')
		expect(result.reasonCode).toBe('not_applicable')
		expect(result.fulfillment).toBeNull()
	})
})

describe('evaluateHeuristic - fulfillment', () => {
	it('presence 기준도 충족 비율을 계산한다', () => {
		const fail = evaluateHeuristic(criteria, {
			redness: { value: 'present', confidence: 90, reason: '홍조 확인' },
			texture: { value: 'present', confidence: 85, reason: '피부 질감 확인' },
		})
		expect(fail.fulfillment).toBe(50)
	})
})

describe('evaluateAdvisory', () => {
	it('조언 문단을 advisory 상태로 감싼다', () => {
		const result = evaluateAdvisory('로고 주변 여백을 넓히면 위계가 살아납니다.')

		expect(result.status).toBe('advisory')
		expect(result.detail).toBe('로고 주변 여백을 넓히면 위계가 살아납니다.')
		expect(result.fulfillment).toBeNull()
	})

	it('조언이 없거나 공백이면 검토로 닫는다', () => {
		expect(evaluateAdvisory(undefined).status).toBe('needs_review')
		expect(evaluateAdvisory(undefined).reasonCode).toBe('ai_output_invalid')
		expect(evaluateAdvisory('   ').reasonCode).toBe('ai_output_invalid')
	})
})
