import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { getCheckSourceDocuments } from './check-ruleset.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('getCheckSourceDocuments', () => {
	it('published Section과 Page를 checks[] 관계가 populate되는 depth로 조회한다', async () => {
		const find = vi.fn(({ collection }) => Promise.resolve({ docs: [{ id: collection }] }))
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		const documents = await getCheckSourceDocuments()

		expect(documents.sections).toEqual([{ id: 'guideline-sections' }])
		expect(documents.pages).toEqual([{ id: 'guideline-pages' }])
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'guideline-sections',
				depth: 1,
				draft: false,
				where: { _status: { equals: 'published' } },
			}),
		)
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'guideline-pages',
				depth: 2,
				draft: false,
				where: { _status: { equals: 'published' } },
			}),
		)
	})
})
