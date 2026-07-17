import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	findRecords: vi.fn(),
	listAvailable: vi.fn(),
	validateKey: vi.fn(),
	validateKeys: vi.fn(),
}))

vi.mock('@/features/asset-check/repositories/available-scenario-check.payload.repository', () => ({
	findPublishedScenarioCheckRecords: mocks.findRecords,
}))
vi.mock('@/features/asset-check/services/list-available-scenario-checks.service', () => ({
	listAvailableScenarioChecks: mocks.listAvailable,
	validateCheckScenarioKey: mocks.validateKey,
	validateCheckScenarioKeys: mocks.validateKeys,
}))

import { CheckScenarios, validateCheckScenarioKeys } from './CheckScenarios'

const validateKeys = validateCheckScenarioKeys as unknown as (
	value: unknown,
	context: unknown,
) => Promise<string | true>

describe('CheckScenarios', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.findRecords.mockResolvedValue([])
		mocks.listAvailable.mockResolvedValue([
			{
				blockName: 'Main palette',
				documentTitle: 'Color',
				executor: 'deterministic',
				key: 'color.palette',
				title: '컬러 팔레트',
			},
		])
		mocks.validateKey.mockReturnValue(true)
		mocks.validateKeys.mockResolvedValue(true)
	})

	it('Check 목록에 Block 출처를 노출하고 중요도는 제외한다', async () => {
		const endpoint = Array.isArray(CheckScenarios.endpoints)
			? CheckScenarios.endpoints[0]?.handler
			: undefined
		if (!endpoint) throw new Error('available-checks endpoint가 없습니다.')

		const req = { payload: {}, user: { role: 'manager' } } as never
		const response = await endpoint(req)
		expect(await response.json()).toEqual({
			docs: [
				{
					blockName: 'Main palette',
					documentTitle: 'Color',
					executor: 'deterministic',
					key: 'color.palette',
					title: '컬러 팔레트',
				},
			],
		})
		expect(mocks.listAvailable).toHaveBeenCalledWith(expect.any(Function))
		const findRecords = mocks.listAvailable.mock.calls[0]?.[0]
		if (typeof findRecords !== 'function') throw new Error('Repository adapter가 없습니다.')
		await findRecords()
		expect(mocks.findRecords).toHaveBeenCalledWith(req)
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

	it('Check key 검증을 Service에 위임한다', async () => {
		const req = { payload: {}, user: { role: 'manager' } }
		const context = { req } as never

		await expect(validateKeys(['color.palette'], context)).resolves.toBe(true)
		expect(mocks.validateKeys).toHaveBeenCalledWith(['color.palette'], expect.any(Function))
		const findRecords = mocks.validateKeys.mock.calls[0]?.[1]
		if (typeof findRecords !== 'function') throw new Error('Repository adapter가 없습니다.')
		await findRecords()
		expect(mocks.findRecords).toHaveBeenCalledWith(req)
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
