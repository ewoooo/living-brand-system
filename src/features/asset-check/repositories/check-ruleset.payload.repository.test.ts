import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { getCheckSourceDocuments } from './check-ruleset.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('getCheckSourceDocuments', () => {
	it('published 통합 문서를 checks[] 관계가 populate되는 depth로 한 번 조회한다', async () => {
		const find = vi.fn(({ collection }) => Promise.resolve({ docs: [{ id: collection }] }))
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		const documents = await getCheckSourceDocuments()

		expect(documents.documents).toEqual([{ id: 'guideline-documents' }])
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'guideline-documents',
				depth: 2,
				draft: false,
			}),
		)
		expect(find.mock.calls[0]?.[0]).not.toHaveProperty('where')
		expect(find).toHaveBeenCalledTimes(1)
	})
})
