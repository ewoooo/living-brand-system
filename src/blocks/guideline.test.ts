import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { GuidelineDocuments } from '@/collections/GuidelineDocuments'
import {
	guidelineBreadcrumbCount,
	guidelineDocumentTypeLabel,
} from '@/components/admin/guideline-document-tree'
import { checkKeyFromEnglishTitle, guidelineBlocks, guidelineChecksField } from './guideline'

const fieldNames = (fields: Field[]) =>
	fields.flatMap((field) =>
		'name' in field && typeof field.name === 'string' ? [field.name] : [],
	)

describe('guideline checks field', () => {
	it('작성 순서와 자동 계층 필드 노출을 구성한다', () => {
		const names = fieldNames(GuidelineDocuments.fields)
		const field = (name: string) =>
			GuidelineDocuments.fields.find(
				(candidate) => 'name' in candidate && candidate.name === name,
			)

		expect(names.indexOf('parent')).toBeLessThan(names.indexOf('title'))
		expect(names.indexOf('blocks')).toBeLessThan(names.indexOf('checks'))
		expect(field('parent')?.admin?.position).toBe('main')
		expect(field('breadcrumbs')?.admin).toMatchObject({ hidden: true })
	})

	it('저장된 계층 깊이를 문서 유형으로 표시한다', () => {
		expect(guidelineBreadcrumbCount([{ url: '/chapter' }], undefined, 0)).toBe(1)
		expect(guidelineBreadcrumbCount(undefined, [{ url: '/chapter/section' }], 0)).toBe(1)
		expect(guidelineBreadcrumbCount(undefined, undefined, 3)).toBe(3)
		expect(guidelineDocumentTypeLabel(1, false, false)).toBe('챕터')
		expect(guidelineDocumentTypeLabel(2, true, false)).toBe('섹션')
		expect(guidelineDocumentTypeLabel(3, true, false)).toBe('페이지')
		expect(guidelineDocumentTypeLabel(2, true, true)).toBe('저장 후 결정')
	})

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

	it('executor에 따라 Options, Heuristic Prompt, Messages를 조건부 노출한다', () => {
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

		const checker = field('checker')
		if (checker?.type !== 'relationship' || typeof checker.filterOptions !== 'function') {
			throw new Error('checker filter is missing')
		}
		expect(checker.filterOptions({ siblingData: { executor: 'heuristic' } } as never)).toEqual({
			executor: { equals: 'heuristic' },
		})
	})

	it('Contrast options를 전용 입력으로 편집하고 저장 전에 검증한다', async () => {
		const checks = guidelineChecksField()
		if (checks.type !== 'array') throw new Error('checks array is missing')
		const options = checks.fields.find(
			(candidate) => 'name' in candidate && candidate.name === 'options',
		)
		if (options?.type !== 'json' || typeof options.validate !== 'function') {
			throw new Error('options json validation is missing')
		}

		expect(options.admin?.components?.Field).toBe('/components/admin/CheckOptionsField')
		const context = {
			req: { payload: {} },
			siblingData: {
				executor: 'deterministic',
				checker: { checkerKey: 'contrast' },
			},
		} as never
		expect(
			await options.validate(
				{
					criteria: [{ measurement: 'contrastRatio', operator: 'gte', expected: 4.5 }],
				} as never,
				context,
			),
		).toBe(true)
		expect(await options.validate(null as never, context)).toBe(
			'최소 대비율은 1 이상 21 이하의 숫자로 입력하세요.',
		)
	})
})
