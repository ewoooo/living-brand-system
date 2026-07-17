import type { Field } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { GuidelineDocuments } from '@/collections/GuidelineDocuments'
import {
	guidelineBreadcrumbCount,
	guidelineDocumentTypeLabel,
} from '@/components/admin/guideline-document-tree'
import { guidelineBlockCatalog, guidelineBlocks } from '@/features/guideline/blocks/catalog'
import { checkKeyFromEnglishTitle } from '@/features/guideline/checks/check-key-from-english-title'
import { IMAGE_RATIO_OPTIONS } from '@/types/image-ratio'
import { ColumnUnitBlock, DoDontBlock, guidelineChecksField, MediaShowcaseBlock } from './guideline'

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

	it('Better Editor 버튼을 게시 컨트롤 앞에 둔다', () => {
		expect(GuidelineDocuments.admin?.components?.edit?.PublishButton).toBe(
			'/components/admin/BetterEditorPublishButton',
		)
		expect(
			GuidelineDocuments.fields.find((field) => 'name' in field && field.name === 'blocks')
				?.admin?.components?.Field,
		).toBeUndefined()
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
			'criteria',
			'heuristicPrompt',
			'messages',
		])
		expect(fieldNames(GuidelineDocuments.fields)).toContain('checks')
		for (const block of guidelineBlocks) expect(fieldNames(block.fields)).toContain('checks')
	})

	it('블록 카탈로그 key와 Payload slug를 같은 순서로 등록한다', () => {
		expect(
			Object.entries(guidelineBlockCatalog).map(([type, definition]) => [
				type,
				definition.schema.slug,
			]),
		).toEqual([
			['columnUnit', 'columnUnit'],
			['mediaShowcase', 'mediaShowcase'],
			['colorPalette', 'colorPalette'],
			['doDont', 'doDont'],
		])
	})

	it('Do/Don’t 이미지 비율에 공용 계약을 사용한다', () => {
		const row = DoDontBlock.fields.find((field) => field.type === 'row')
		if (row?.type !== 'row') throw new Error('Do/Don’t option row is missing')
		const imageRatio = row.fields.find(
			(field) => 'name' in field && field.name === 'imageRatio',
		)
		if (imageRatio?.type !== 'select') throw new Error('imageRatio select is missing')

		expect(imageRatio.options).toEqual(IMAGE_RATIO_OPTIONS)
		expect(IMAGE_RATIO_OPTIONS.map(({ value }) => value)).toEqual([
			'4:3',
			'1:1',
			'16:9',
			'3:2',
			'2:3',
			'4:5',
			'5:4',
			'9:16',
		])
	})

	it('다른 이미지 블록도 공용 비율 계약을 사용한다', () => {
		for (const [block, defaultValue] of [
			[ColumnUnitBlock, '4:3'],
			[MediaShowcaseBlock, '16:9'],
		] as const) {
			const imageRatio = block.fields.find(
				(field) => 'name' in field && field.name === 'imageRatio',
			)
			if (imageRatio?.type !== 'select') throw new Error('imageRatio select is missing')

			expect(imageRatio.options).toEqual(IMAGE_RATIO_OPTIONS)
			expect(imageRatio.defaultValue).toBe(defaultValue)
		}
	})

	it('영문 제목에서 namespace 없는 안정적인 key를 만든다', () => {
		expect(checkKeyFromEnglishTitle('Imagery Mood & Tone')).toBe('imagery-mood-tone')
		expect(checkKeyFromEnglishTitle('  Logo / Clear Space  ')).toBe('logo-clear-space')
	})

	it('Checker에서 executor를 파생해 관련 설정만 조건부 노출한다', async () => {
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

		const executor = field('executor')
		if (executor?.type !== 'select') throw new Error('executor select is missing')
		expect(executor.admin?.hidden).toBe(true)
		expect(executor.defaultValue).toBeUndefined()
		const populateExecutor = executor.hooks?.beforeValidate?.[0]
		if (typeof populateExecutor !== 'function') {
			throw new Error('executor beforeValidate hook is missing')
		}
		const findByID = vi.fn().mockResolvedValue({ executor: 'heuristic' })
		const req = { payload: { findByID } }
		expect(
			await populateExecutor({
				req,
				siblingData: { checker: 7 },
				value: 'deterministic',
			} as never),
		).toBe('heuristic')
		expect(findByID).toHaveBeenCalledWith({
			collection: 'rule-checkers',
			id: 7,
			depth: 0,
			draft: true,
			overrideAccess: true,
			req,
		})

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
		if (checker?.type !== 'relationship') throw new Error('checker relationship is missing')
		expect(checker.admin?.components?.Field).toBe('/components/admin/CheckCheckerField')
		expect(checker.filterOptions).toBeUndefined()
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

	it('criteria row는 kind에 따라 관찰형/수치형 입력을 나눈다', () => {
		const checks = guidelineChecksField() as { fields: { name?: string; fields?: unknown[] }[] }
		const criteria = checks.fields.find(
			(field) => 'name' in field && field.name === 'criteria',
		) as {
			validate: (value: unknown, args: { siblingData: unknown }) => true | string
			fields: { fields: { name: string; required?: boolean }[] }[]
		}
		const rowFieldNames = criteria.fields.flatMap((row) =>
			row.fields.map((field) => field.name),
		)
		expect(rowFieldNames).toEqual(
			expect.arrayContaining([
				'question',
				'kind',
				'expected',
				'operator',
				'expectedValue',
				'max',
				'unit',
			]),
		)

		const heuristic = { executor: 'heuristic' }
		// 관찰형: expected 필수
		expect(
			criteria.validate([{ kind: 'presence', question: 'q' }], { siblingData: heuristic }),
		).toContain('적합 기준')
		// 수치형: operator/expectedValue 필수
		expect(
			criteria.validate([{ kind: 'measure', question: 'q' }], { siblingData: heuristic }),
		).toContain('연산과 기대값')
		// between: max > expectedValue
		expect(
			criteria.validate(
				[
					{
						kind: 'measure',
						question: 'q',
						operator: 'between',
						expectedValue: 30,
						max: 5,
					},
				],
				{ siblingData: heuristic },
			),
		).toContain('최대값')
		// 정상 케이스
		expect(
			criteria.validate(
				[
					{ kind: 'presence', question: 'q', expected: 'present' },
					{
						kind: 'measure',
						question: 'q',
						operator: 'between',
						expectedValue: 5,
						max: 30,
						unit: '%',
					},
				],
				{ siblingData: heuristic },
			),
		).toBe(true)
		// kind 미지정 기존 데이터는 presence로 검증
		expect(
			criteria.validate([{ question: 'q', expected: 'absent' }], { siblingData: heuristic }),
		).toBe(true)
	})
})
