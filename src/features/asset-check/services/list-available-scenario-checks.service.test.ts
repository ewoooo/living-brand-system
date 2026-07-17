import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findPublishedScenarioCheckRecords } from '@/features/asset-check/repositories/available-scenario-check.payload.repository'
import {
	listAvailableScenarioChecks,
	validateCheckScenarioKey,
	validateCheckScenarioKeys,
} from './list-available-scenario-checks.service'

vi.mock('@/features/asset-check/repositories/available-scenario-check.payload.repository', () => ({
	findPublishedScenarioCheckRecords: vi.fn(),
}))

const repositoryContext = {} as never

const record = (overrides: Record<string, unknown> = {}) => ({
	blockName: 'Block',
	documentTitle: 'Document',
	key: 'check.key',
	title: 'Check title',
	...overrides,
})

describe('listAvailableScenarioChecks', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('표시 이름을 조립하고 key 중복을 제거한 뒤 문서·Block·제목 순으로 정렬한다', async () => {
		vi.mocked(findPublishedScenarioCheckRecords).mockResolvedValue([
			record({ blockName: null, documentTitle: 'B', key: 'type.scale', title: 'Type Scale' }),
			record({ blockName: 'Z', documentTitle: 'A', key: 'color.palette', title: 'Color' }),
			record({ blockName: 'A', documentTitle: 'A', key: 'logo.clear', titleKo: '로고' }),
			record({
				blockName: 'Z',
				documentTitle: 'A',
				executor: 'deterministic',
				key: 'color.palette',
				title: 'Color',
				titleKo: '컬러',
			}),
		])

		await expect(listAvailableScenarioChecks(repositoryContext)).resolves.toEqual([
			{
				blockName: 'A',
				documentTitle: 'A',
				executor: undefined,
				key: 'logo.clear',
				title: '로고',
			},
			{
				blockName: 'Z',
				documentTitle: 'A',
				executor: 'deterministic',
				key: 'color.palette',
				title: '컬러',
			},
			{
				blockName: '문서',
				documentTitle: 'B',
				executor: undefined,
				key: 'type.scale',
				title: 'Type Scale',
			},
		])
	})
})

describe('CheckScenario validation', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('영속 key 형식을 검증한다', () => {
		expect(validateCheckScenarioKey('quick-check')).toBe(true)
		expect(validateCheckScenarioKey('Quick Check')).toBe(
			'Key는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.',
		)
	})

	it('선택 형식과 중복을 먼저 확인하고 published Check 존재 여부를 조회한다', async () => {
		vi.mocked(findPublishedScenarioCheckRecords).mockResolvedValue([
			record({ key: 'color.palette' }),
		] as never)

		await expect(validateCheckScenarioKeys([], repositoryContext)).resolves.toBe(
			'Check를 1개 이상 포함하세요.',
		)
		await expect(validateCheckScenarioKeys([''], repositoryContext)).resolves.toBe(
			'Check key는 비어 있지 않은 문자열이어야 합니다.',
		)
		await expect(
			validateCheckScenarioKeys(['color.palette', 'color.palette'], repositoryContext),
		).resolves.toBe('중복된 Check가 있습니다.')
		expect(findPublishedScenarioCheckRecords).not.toHaveBeenCalled()

		await expect(validateCheckScenarioKeys(['color.palette'], repositoryContext)).resolves.toBe(
			true,
		)
		await expect(validateCheckScenarioKeys(['missing'], repositoryContext)).resolves.toBe(
			'발행된 Guideline에 없는 Check입니다: missing',
		)
	})
})
