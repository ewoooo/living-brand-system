import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findDraftGuidelineDocumentById } from '../repositories/guideline-preview.payload.repository'
import { getGuidelineChapter } from './get-guideline-chapter.service'
import {
	getGuidelineChapterPreview,
	getGuidelineDocumentPreviewTarget,
	getGuidelineSectionPreview,
} from './get-guideline-document-preview.service'
import { getGuidelineSection } from './get-guideline-section.service'

vi.mock('../repositories/guideline-preview.payload.repository', () => ({
	findDraftGuidelineDocumentById: vi.fn(),
}))
vi.mock('./get-guideline-chapter.service', () => ({ getGuidelineChapter: vi.fn() }))
vi.mock('./get-guideline-section.service', () => ({
	getGuidelineSection: vi.fn(),
}))

describe('guideline document preview', () => {
	beforeEach(() => vi.clearAllMocks())

	it('breadcrumb 깊이에 따라 chapter와 page draft를 치환한다', async () => {
		vi.mocked(findDraftGuidelineDocumentById).mockResolvedValue({
			id: 7,
			title: 'Logo Usage',
			slug: 'logo-usage-page-7',
			legacySlug: 'logo usage',
			description: null,
			displayOrder: 1,
			blocks: [],
			breadcrumbs: [
				{ url: '/guideline/brand-system' },
				{ url: '/guideline/brand-system/basics' },
				{ url: '/guideline/brand-system/basics/logo-usage' },
			],
		} as never)

		const target = await getGuidelineDocumentPreviewTarget(7, { id: 1 } as never)

		expect(target?.href).toBe('/guideline/brand-system/basics?previewDocument=7#logo%20usage')

		vi.mocked(getGuidelineSection).mockResolvedValue({
			title: 'Basics',
			headerImage: null,
			blocks: [],
			description: null,
			pages: [
				{
					id: 7,
					title: 'Published title',
					slug: 'logo-usage',
					description: null,
					displayOrder: 1,
					blocks: [],
				},
			],
		})

		const preview = await getGuidelineSectionPreview(7, { id: 1 } as never)

		expect(preview?.pages).toHaveLength(1)
		expect(preview?.pages[0]?.title).toBe('Logo Usage')

		vi.mocked(findDraftGuidelineDocumentById).mockResolvedValue({
			id: 2,
			title: 'Draft Brand System',
			label: 'Draft',
			description: null,
			breadcrumbs: [{ url: '/guideline/brand-system' }],
		} as never)
		vi.mocked(getGuidelineChapter).mockResolvedValue({
			title: 'Brand System',
			label: null,
			description: null,
			sections: [],
		})

		await expect(getGuidelineChapterPreview(2, { id: 1 } as never)).resolves.toMatchObject({
			title: 'Draft Brand System',
			label: 'Draft',
		})
	})
})
