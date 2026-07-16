import { describe, expect, it, vi } from 'vitest'
import { getCheckSourceDocuments } from '@/features/asset-check/repositories/check-ruleset.payload.repository'
import { getCheckRuleset } from '@/features/asset-check/services/get-check-ruleset.service'
import { toRuntimeCheckMessages } from '@/features/asset-check/utils/check-messages'

vi.mock('@/features/asset-check/repositories/check-ruleset.payload.repository', () => ({
	getCheckSourceDocuments: vi.fn(),
}))

describe('getCheckRuleset', () => {
	it('연결된 Checker 설정과 deterministic 구현체를 표시 계약으로 반환한다', async () => {
		vi.mocked(getCheckSourceDocuments).mockResolvedValue({
			documents: [
				{
					id: 1,
					title: 'Primary Logo',
					slug: 'primary-logo',
					displayOrder: 1,
					breadcrumbs: [],
					blocks: [],
					checks: [
						{
							key: 'logo.clear-space',
							title: 'Clear Space',
							checker: {
								key: 'logo-layout',
								executor: 'deterministic',
								checkerKey: 'clear-space',
							},
						},
					],
				},
			],
		} as never)

		const sections = await getCheckRuleset()

		expect(sections[0]?.checks[0]).toMatchObject({
			source: { documentId: 1 },
			evidence: { type: 'document', blocks: [] },
			checker: {
				key: 'logo-layout',
				type: 'deterministic',
				implementationKey: 'clear-space',
			},
		})
	})

	it('measure criterion을 HeuristicCriterion으로 매핑하고 불완전 행은 버린다', async () => {
		vi.mocked(getCheckSourceDocuments).mockResolvedValue({
			documents: [
				{
					id: 1,
					title: 'Primary Logo',
					slug: 'primary-logo',
					displayOrder: 1,
					breadcrumbs: [],
					blocks: [],
					checks: [
						{
							key: 'logo.share',
							title: 'Logo Share',
							checker: {
								key: 'logo-share',
								executor: 'heuristic',
								model: 'gpt-4o',
							},
							criteria: [
								{
									id: 'c1',
									question: '로고 점유율(%)은?',
									kind: 'measure',
									operator: 'gte',
									expectedValue: 5,
									unit: '%',
								},
								{ id: 'c2', question: '불완전 수치형', kind: 'measure' },
								{ id: 'c3', question: '관찰형', expected: 'present' },
							],
						},
					],
				},
			],
		} as never)

		const sections = await getCheckRuleset()
		const check = sections[0]?.checks[0]

		expect(check?.heuristicCriteria).toEqual([
			{
				id: 'c1',
				question: '로고 점유율(%)은?',
				kind: 'measure',
				operator: 'gte',
				expected: 5,
				max: undefined,
				unit: '%',
			},
			{ id: 'c3', question: '관찰형', expected: 'present' },
		])
	})
})

describe('toRuntimeCheckMessages', () => {
	it('maps Payload Check message fields to runtime status keys', () => {
		expect(
			toRuntimeCheckMessages({
				pass: 'pass message',
				ok: 'ok message',
				needsReview: 'review message',
				fail: 'fail message',
			}),
		).toEqual({
			pass: 'pass message',
			ok: 'ok message',
			needs_review: 'review message',
			fail: 'fail message',
		})
	})
})
