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

		expect(sections[0]?.checks[0]?.checker).toEqual({
			key: 'logo-layout',
			type: 'deterministic',
			implementationKey: 'clear-space',
		})
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
