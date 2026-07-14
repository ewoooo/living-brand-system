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
	if (
		(field?.type !== 'text' && field?.type !== 'select') ||
		typeof field.validate !== 'function'
	) {
		throw new Error(`${name} validation is not configured`)
	}
	return field.validate as unknown as Validate
}

describe('RuleCheckers executor binding', () => {
	it('저장소 식별자는 유지하고 Admin에는 Checker로 표시한다', () => {
		expect(RuleCheckers.slug).toBe('rule-checkers')
		expect(RuleCheckers.labels).toEqual({ singular: 'Checker', plural: 'Checkers' })
	})

	it('선택한 executor에 필요한 binding만 필수로 검증한다', () => {
		expect(
			validationFor('checkerKey')('', { siblingData: { executor: 'deterministic' } }),
		).toBe('Checker Key를 입력하세요.')
		expect(validationFor('checkerKey')('', { siblingData: { executor: 'heuristic' } })).toBe(
			true,
		)
		expect(validationFor('model')('', { siblingData: { executor: 'heuristic' } })).toBe(
			'Model을 선택하세요.',
		)
		expect(validationFor('promptKey')('', { siblingData: { executor: 'heuristic' } })).toBe(
			'Prompt Key를 입력하세요.',
		)
		expect(validationFor('promptKey')('', { siblingData: { executor: 'manual' } })).toBe(true)
	})

	it('heuristic model은 Opus, Sonnet, Haiku 중에서 선택한다', () => {
		const model = RuleCheckers.fields.find(
			(candidate) => 'name' in candidate && candidate.name === 'model',
		)
		if (model?.type !== 'select') throw new Error('model select is not configured')

		expect(model.options).toEqual([
			{ label: 'Opus', value: 'claude-opus-4-8' },
			{ label: 'Sonnet', value: 'claude-sonnet-5' },
			{ label: 'Haiku', value: 'claude-haiku-4-5' },
		])
	})
})
