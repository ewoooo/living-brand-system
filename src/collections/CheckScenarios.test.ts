import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	findPublished: vi.fn(),
	collectSources: vi.fn(),
}))

vi.mock('@/features/guideline/repositories/published-guideline-checks.payload.repository', () => ({
	findPublishedUnifiedGuidelineCheckDocuments: mocks.findPublished,
}))
vi.mock('@/features/guideline/checks/collect-guideline-check-sources', () => ({
	collectGuidelineCheckSources: mocks.collectSources,
}))

import { CheckScenarios, validateCheckScenarioKeys } from './CheckScenarios'

const validateKeys = validateCheckScenarioKeys as unknown as (
	value: unknown,
	context: unknown,
) => Promise<string | true>

describe('CheckScenarios', () => {
	beforeEach(() => {
		mocks.findPublished.mockResolvedValue({ documents: [{ title: 'Color' }] })
		mocks.collectSources.mockReturnValue([
			{
				check: {
					key: 'color.palette',
					title: 'Color Palette',
					titleKo: '컬러 팔레트',
					tier: 'required',
					checker: { executor: 'deterministic' },
				},
			},
		])
	})

	it('CheckScenario 관리 계약을 노출한다', () => {
		expect(CheckScenarios.slug).toBe('check-scenarios')
		expect(CheckScenarios.admin?.useAsTitle).toBe('title')
		expect(CheckScenarios.versions).toBeTruthy()
		expect(
			CheckScenarios.fields.find((field) => 'name' in field && field.name === 'checkKeys'),
		).toMatchObject({
			type: 'json',
			required: true,
			admin: { components: { Field: '/components/admin/CheckScenarioChecksField' } },
		})
	})

	it('published Guideline Check만 중복 없이 허용한다', async () => {
		const context = { req: { payload: {}, user: { role: 'manager' } } } as never

		await expect(validateKeys([], context)).resolves.toBe('Check를 1개 이상 포함하세요.')
		await expect(validateKeys(['color.palette', 'color.palette'], context)).resolves.toBe(
			'중복된 Check가 있습니다.',
		)
		await expect(validateKeys(['color.palette'], context)).resolves.toBe(true)
		await expect(validateKeys(['missing'], context)).resolves.toBe(
			'발행된 Guideline에 없는 Check입니다: missing',
		)
	})

	it('한 번 발행된 시나리오는 삭제 대신 archive하도록 표시한다', async () => {
		const hook = CheckScenarios.hooks?.beforeChange?.[0]
		if (!hook) throw new Error('beforeChange hook이 없습니다.')

		expect(hook({ data: { _status: 'published' }, originalDoc: {} } as never)).toMatchObject({
			hasBeenPublished: true,
		})

		const deleteAccess = CheckScenarios.access?.delete
		if (typeof deleteAccess !== 'function') throw new Error('delete access가 없습니다.')
		expect(deleteAccess({ req: { user: { role: 'manager' } } } as never)).toEqual({
			hasBeenPublished: { equals: false },
		})
	})
})
