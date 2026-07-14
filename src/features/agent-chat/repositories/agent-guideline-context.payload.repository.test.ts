import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { listGuidelineDocuments } from './agent-guideline-context.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('listGuidelineDocuments', () => {
	it('Agent 경로는 기존 ko → en fallback과 published 필터를 유지한다', async () => {
		const find = vi.fn().mockResolvedValue({ docs: [] })
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await listGuidelineDocuments({ id: 1 })

		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'guideline-documents',
				draft: false,
				fallbackLocale: 'en',
				locale: 'ko',
			}),
		)
		expect(find.mock.calls[0]?.[0]).not.toHaveProperty('where')
	})
})
