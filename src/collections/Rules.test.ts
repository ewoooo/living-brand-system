import { describe, expect, it, vi } from 'vitest'
import { Rules } from './Rules'

function fieldNamed(name: string) {
	return Rules.fields.find((candidate) => 'name' in candidate && candidate.name === name)
}

describe('Rules collection contract', () => {
	it('전역 고유 key를 가진 독립 컬렉션으로 노출한다', () => {
		expect(Rules.slug).toBe('rules')
		expect(Rules.labels).toEqual({ singular: '검수 규칙', plural: '검수 규칙' })
		expect(Rules.admin?.useAsTitle).toBe('title')
		expect(Rules.admin?.group).toBe('검수 설정')

		const key = fieldNamed('key')
		if (key?.type !== 'text') throw new Error('key text field is not configured')
		expect(key.required).toBe(true)
		expect(key.unique).toBe(true)
		expect(key.index).toBe(true)
		expect(key.admin?.readOnly).toBe(true)
	})

	it('기존 Check와 동일한 편집 필드 구성을 유지한다', () => {
		const names = Rules.fields.flatMap((field) =>
			'name' in field && typeof field.name === 'string' ? [field.name] : [],
		)
		expect(names).toEqual([
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
	})

	it('영문 제목에서 key를 자동 생성하고 저장된 key는 유지한다', async () => {
		const key = fieldNamed('key')
		const populateKey = key && 'hooks' in key ? key.hooks?.beforeValidate?.[0] : undefined
		if (typeof populateKey !== 'function') throw new Error('key beforeValidate hook is missing')

		expect(
			await populateKey({
				siblingData: { title: 'Logo / Clear Space' },
				value: undefined,
			} as never),
		).toBe('logo-clear-space')
		expect(
			await populateKey({
				siblingData: { title: 'Changed Title' },
				value: ' existing-key ',
			} as never),
		).toBe('existing-key')
	})

	it('Checker에서 executor를 파생해 관련 설정만 조건부 노출한다', async () => {
		const condition = (name: string, executor: 'deterministic' | 'heuristic' | 'manual') => {
			const candidate = fieldNamed(name)
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
		expect(condition('messages', 'heuristic')).toBe(false)
		expect(condition('messages', 'manual')).toBe(true)

		const executor = fieldNamed('executor')
		if (executor?.type !== 'select') throw new Error('executor select is missing')
		expect(executor.admin?.hidden).toBe(true)
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
	})

	it('heuristic Rule은 판정 기준을 1개 이상 요구한다', async () => {
		const criteria = fieldNamed('criteria')
		if (criteria?.type !== 'array' || typeof criteria.validate !== 'function') {
			throw new Error('criteria array validation is missing')
		}

		expect(
			await criteria.validate([], { siblingData: { executor: 'heuristic' } } as never),
		).toBe('Heuristic Rule에는 판정 기준이 1개 이상 필요합니다.')
		expect(
			await criteria.validate([], { siblingData: { executor: 'deterministic' } } as never),
		).toBe(true)
		expect(
			await criteria.validate([{ kind: 'measure', question: 'q' }], {
				siblingData: { executor: 'heuristic' },
			} as never),
		).toContain('연산과 기대값')
	})

	it('Contrast options를 전용 입력으로 편집하고 저장 전에 검증한다', async () => {
		const options = fieldNamed('options')
		if (options?.type !== 'json' || typeof options.validate !== 'function') {
			throw new Error('options json validation is missing')
		}

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
		const criteria = fieldNamed('criteria') as unknown as {
			validate: (value: unknown, args: { siblingData: unknown }) => true | string
			fields: { fields: { name: string }[] }[]
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

	it('checker/options는 기존 Check 전용 admin 컴포넌트를 재사용한다', () => {
		const checker = fieldNamed('checker')
		if (checker?.type !== 'relationship') throw new Error('checker relationship is missing')
		expect(checker.relationTo).toBe('rule-checkers')
		expect(checker.admin?.components?.Field).toBe('/components/admin/CheckCheckerField')

		const options = fieldNamed('options')
		if (options?.type !== 'json') throw new Error('options json is missing')
		expect(options.admin?.components?.Field).toBe('/components/admin/CheckOptionsField')
	})
})
