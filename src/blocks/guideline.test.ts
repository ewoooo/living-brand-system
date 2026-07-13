import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { GuidelinePages } from '@/collections/GuidelinePages'
import { GuidelineSections } from '@/collections/GuidelineSections'
import { guidelineBlocks, guidelineChecksField } from './guideline'

const fieldNames = (fields: Field[]) =>
	fields.flatMap((field) =>
		'name' in field && typeof field.name === 'string' ? [field.name] : [],
	)

describe('guideline checks field', () => {
	it('Section, Page와 모든 Block에 같은 checks[] 계약을 둔다', () => {
		const checks = guidelineChecksField()
		expect(checks.type).toBe('array')
		if (checks.type !== 'array') return
		expect(fieldNames(checks.fields)).toEqual([
			'key',
			'title',
			'tier',
			'checker',
			'options',
			'messages',
		])
		expect(fieldNames(GuidelineSections.fields)).toContain('checks')
		expect(fieldNames(GuidelinePages.fields)).toContain('checks')
		for (const block of guidelineBlocks) expect(fieldNames(block.fields)).toContain('checks')
	})
})
