import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
	findPublishedChapterBySlug,
	findPublishedSectionBySlug,
	listPublishedGuidelineNavigationDocuments,
} from './guideline-view.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('listPublishedGuidelineNavigationDocuments', () => {
	it('fallback 없이 published 통합 문서만 한 번 조회한다', async () => {
		const find = vi.fn().mockResolvedValue({ docs: [] })
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await listPublishedGuidelineNavigationDocuments()

		expect(find).toHaveBeenCalledTimes(1)
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'guideline-documents',
				draft: false,
				fallbackLocale: false,
				locale: 'ko',
			}),
		)
		expect(find.mock.calls[0]?.[0]).not.toHaveProperty('where')
	})

	it('chapter와 section을 canonical slug와 부모 범위로 조회한다', async () => {
		const find = vi.fn().mockResolvedValue({ docs: [] })
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await findPublishedChapterBySlug('brand')
		await findPublishedSectionBySlug(1, 'logo')

		expect(find.mock.calls[0]?.[0].where).toEqual({
			and: [{ slug: { equals: 'brand' } }, { parent: { exists: false } }],
		})
		expect(find.mock.calls[1]?.[0].where).toEqual({
			and: [{ slug: { equals: 'logo' } }, { parent: { equals: 1 } }],
		})
	})
})
