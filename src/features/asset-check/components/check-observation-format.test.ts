import { describe, expect, it } from 'vitest'
import { formatObservationActual, formatObservationExpected } from './check-observation-format'

const base = { criterionId: 'c', question: 'q', confidence: 80, reason: 'r', satisfied: true }

describe('formatObservationExpected', () => {
	it('presence 기준을 한국어로 표기한다', () => {
		expect(formatObservationExpected({ ...base, expected: 'present', actual: 'present' })).toBe(
			'있어야 함',
		)
		expect(formatObservationExpected({ ...base, expected: 'absent', actual: 'absent' })).toBe(
			'없어야 함',
		)
	})

	it('measure 기준을 연산·단위와 함께 표기한다', () => {
		expect(
			formatObservationExpected({
				...base,
				kind: 'measure',
				expected: 5,
				operator: 'gte',
				unit: '%',
				actual: 12,
			}),
		).toBe('5% 이상')
		expect(
			formatObservationExpected({
				...base,
				kind: 'measure',
				expected: 1,
				operator: 'lte',
				unit: '개',
				actual: 1,
			}),
		).toBe('1개 이하')
		expect(
			formatObservationExpected({
				...base,
				kind: 'measure',
				expected: 5,
				max: 30,
				operator: 'between',
				unit: '%',
				actual: 12,
			}),
		).toBe('5~30%')
	})
})

describe('formatObservationActual', () => {
	it('관측값을 한국어로 표기한다', () => {
		expect(formatObservationActual({ ...base, expected: 'present', actual: 'present' })).toBe(
			'있음',
		)
		expect(formatObservationActual({ ...base, expected: 'present', actual: 'uncertain' })).toBe(
			'판단 불가',
		)
		expect(
			formatObservationActual({ ...base, expected: 'present', actual: 'not_applicable' }),
		).toBe('해당 없음')
		expect(
			formatObservationActual({
				...base,
				kind: 'measure',
				expected: 5,
				operator: 'gte',
				unit: '%',
				actual: 12,
			}),
		).toBe('12%')
	})
})
