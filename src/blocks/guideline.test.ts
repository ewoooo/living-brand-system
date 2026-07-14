import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { GuidelineDocuments } from '@/collections/GuidelineDocuments'
import { checkKeyFromEnglishTitle, guidelineBlocks, guidelineChecksField } from './guideline'

const fieldNames = (fields: Field[]) =>
	fields.flatMap((field) =>
		'name' in field && typeof field.name === 'string' ? [field.name] : [],
	)

describe('guideline checks field', () => {
	it('통합 문서와 모든 Block에 같은 checks[] 계약을 둔다', () => {
		const checks = guidelineChecksField()
		expect(checks.type).toBe('array')
		if (checks.type !== 'array') return
		expect(fieldNames(checks.fields)).toEqual([
			'title',
			'titleKo',
			'key',
			'tier',
			'executor',
			'checker',
			'options',
			'criteria',
			'heuristicPrompt',
			'messages',
		])
		expect(fieldNames(GuidelineDocuments.fields)).toContain('checks')
		for (const block of guidelineBlocks) expect(fieldNames(block.fields)).toContain('checks')
	})

	it('영문 제목에서 namespace 없는 안정적인 key를 만든다', () => {
		expect(checkKeyFromEnglishTitle('Imagery Mood & Tone')).toBe('imagery-mood-tone')
		expect(checkKeyFromEnglishTitle('  Logo / Clear Space  ')).toBe('logo-clear-space')
	})

	it('executor에 따라 Options, Heuristic Criteria, Prompt, Messages를 조건부 노출한다', async () => {
		const checks = guidelineChecksField()
		if (checks.type !== 'array') return
		const field = (name: string) =>
			checks.fields.find((candidate) => 'name' in candidate && candidate.name === name)
		const condition = (name: string, executor: 'deterministic' | 'heuristic' | 'manual') => {
			const candidate = field(name)
			const adminCondition =
				candidate && 'admin' in candidate ? candidate.admin?.condition : null
			if (typeof adminCondition !== 'function')
				throw new Error(`${name} condition is missing`)
			return adminCondition({}, { executor }, {} as never)
		}

		expect(condition('options', 'deterministic')).toBe(true)
		expect(condition('options', 'heuristic')).toBe(false)
		expect(condition('criteria', 'heuristic')).toBe(true)
		expect(condition('criteria', 'deterministic')).toBe(false)
		expect(condition('heuristicPrompt', 'heuristic')).toBe(true)
		expect(condition('heuristicPrompt', 'manual')).toBe(false)
		expect(condition('messages', 'heuristic')).toBe(false)
		expect(condition('messages', 'manual')).toBe(true)

		const heuristicPrompt = field('heuristicPrompt')
		if (heuristicPrompt?.type !== 'textarea') {
			throw new Error('heuristicPrompt textarea is missing')
		}
		expect(heuristicPrompt.maxLength).toBe(2000)
		expect(heuristicPrompt.required).not.toBe(true)

		const heuristicCriteria = field('criteria')
		if (heuristicCriteria?.type !== 'array' || !heuristicCriteria.validate) {
			throw new Error('heuristicCriteria array is missing')
		}
		expect(
			await heuristicCriteria.validate([], {
				siblingData: { executor: 'heuristic' },
			} as never),
		).toBe('Heuristic Check에는 판정 기준이 1개 이상 필요합니다.')
		expect(
			await heuristicCriteria.validate([], {
				siblingData: { executor: 'deterministic' },
			} as never),
		).toBe(true)

		const checker = field('checker')
		if (checker?.type !== 'relationship' || typeof checker.filterOptions !== 'function') {
			throw new Error('checker filter is missing')
		}
		expect(checker.filterOptions({ siblingData: { executor: 'heuristic' } } as never)).toEqual({
			executor: { equals: 'heuristic' },
		})
	})
})
