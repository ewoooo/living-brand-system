import { describe, expect, it } from 'vitest'
import { RuleCheckers } from './RuleCheckers'

type Validate = (
	value: unknown,
	context: { siblingData: { executor: 'deterministic' | 'heuristic' | 'manual' } },
) => unknown

function validationFor(name: string): Validate {
	const field = RuleCheckers.fields.find(
		(candidate) => 'name' in candidate && candidate.name === name,
	)
	if (field?.type !== 'text' || typeof field.validate !== 'function') {
		throw new Error(`${name} validation is not configured`)
	}
	return field.validate as unknown as Validate
}

describe('RuleCheckers executor binding', () => {
	it('선택한 executor에 필요한 binding만 필수로 검증한다', () => {
		expect(
			validationFor('checkerKey')('', { siblingData: { executor: 'deterministic' } }),
		).toBe('Checker Key를 입력하세요.')
		expect(validationFor('checkerKey')('', { siblingData: { executor: 'heuristic' } })).toBe(
			true,
		)
		expect(validationFor('model')('', { siblingData: { executor: 'heuristic' } })).toBe(
			'Model을 입력하세요.',
		)
		expect(validationFor('promptKey')('', { siblingData: { executor: 'heuristic' } })).toBe(
			'Prompt Key를 입력하세요.',
		)
		expect(validationFor('promptKey')('', { siblingData: { executor: 'manual' } })).toBe(true)
	})
})
