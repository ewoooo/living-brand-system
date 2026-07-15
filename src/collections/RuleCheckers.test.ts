import { describe, expect, it } from 'vitest'
import { RuleCheckers } from './RuleCheckers'

type Validate = (
	value: unknown,
	context: { siblingData: { executor: 'deterministic' | 'heuristic' | 'manual' } },
) => unknown

function fieldNamed(name: string) {
	return RuleCheckers.fields.find((candidate) => 'name' in candidate && candidate.name === name)
}

function validationFor(name: string): Validate {
	const field = fieldNamed(name)
	if (
		(field?.type !== 'text' && field?.type !== 'select') ||
		typeof field.validate !== 'function'
	) {
		throw new Error(`${name} validation is not configured`)
	}
	return field.validate as unknown as Validate
}

describe('RuleCheckers executor binding', () => {
	it('저장소 식별자는 유지하고 Admin에는 name을 표시한다', () => {
		expect(RuleCheckers.slug).toBe('rule-checkers')
		expect(RuleCheckers.labels).toEqual({ singular: 'Checker', plural: 'Checkers' })
		expect(RuleCheckers.admin?.useAsTitle).toBe('name')

		const name = fieldNamed('name')
		expect(name?.type === 'text' && name.required).toBe(true)
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
	})

	it('prompt는 heuristic 전용 선택 항목이고 promptKey는 존재하지 않는다', () => {
		const prompt = fieldNamed('prompt')
		expect(prompt?.type).toBe('textarea')
		expect(prompt && 'required' in prompt && prompt.required).toBeFalsy()
		expect(fieldNamed('promptKey')).toBeUndefined()
	})

	it('heuristic model은 Opus, Sonnet, Haiku 중에서 선택한다', () => {
		const model = fieldNamed('model')
		if (model?.type !== 'select') throw new Error('model select is not configured')

		expect(model.options).toEqual([
			{ label: 'Opus', value: 'claude-opus-4-8' },
			{ label: 'Sonnet', value: 'claude-sonnet-5' },
			{ label: 'Haiku', value: 'claude-haiku-4-5' },
		])
	})
})
