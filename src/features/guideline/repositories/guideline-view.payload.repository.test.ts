import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
	findGuidelineMetadataGlobal,
	findPublishedChapterBySlug,
	findPublishedSectionBySlug,
	listPublishedGuidelineNavigationDocuments,
} from './guideline-view.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('listPublishedGuidelineNavigationDocuments', () => {
	it('global 관계 문서를 plain metadata DTO로 변환한다', async () => {
		const findGlobal = vi.fn().mockResolvedValue({
			companyName: 'Company',
			documentTitle: 'Guideline',
			favicon: { id: 1, url: '/favicon.png' },
			issuedLabel: '2026.07',
			primaryColor: { id: 2, hex: '112233' },
			primaryColorDark: 3,
		})
		vi.mocked(getPayload).mockResolvedValue({ findGlobal } as never)

		await expect(findGuidelineMetadataGlobal()).resolves.toEqual({
			companyName: 'Company',
			documentTitle: 'Guideline',
			faviconHref: '/favicon.png',
			issuedLabel: '2026.07',
			primaryHex: '112233',
			primaryDarkHex: null,
		})
	})

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

	it('navigation Payload 관계와 본문을 plain DTO로 변환한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					id: 2,
					title: 'Basics',
					slug: 'basics',
					description: null,
					parent: { id: 1, title: 'Brand' },
					breadcrumbs: [{ doc: 1, url: '/guideline/brand/basics' }],
				},
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await expect(listPublishedGuidelineNavigationDocuments()).resolves.toEqual([
			{
				description: null,
				href: '/guideline/brand/basics',
				id: 2,
				parentId: 1,
				slug: 'basics',
				title: 'Basics',
			},
		])
	})
})
