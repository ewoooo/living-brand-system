import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findDraftGuidelinePageById } from '../repositories/guideline-preview.payload.repository'
import {
	getGuidelinePagePreview,
	getGuidelinePagePreviewTarget,
} from './get-guideline-page-preview.service'
import { getGuidelineSection } from './get-guideline-section.service'

vi.mock('../repositories/guideline-preview.payload.repository', () => ({
	findDraftGuidelinePageById: vi.fn(),
}))
vi.mock('./get-guideline-section.service', () => ({
	getGuidelineSection: vi.fn(),
}))

describe('getGuidelinePagePreviewTarget', () => {
	beforeEach(() => vi.clearAllMocks())

	it('populated 관계로 실제 section preview URL을 만든다', async () => {
		vi.mocked(findDraftGuidelinePageById).mockResolvedValue({
			id: 7,
			title: 'Logo Usage',
			slug: 'logo usage',
			description: null,
			displayOrder: 1,
			blocks: [],
			section: {
				id: 3,
				slug: 'basics',
				chapter: { id: 2, slug: 'brand system' },
			},
		} as never)

		const target = await getGuidelinePagePreviewTarget(7, { id: 1 } as never)

		expect(target?.href).toBe('/guideline/brand%20system/basics?previewPage=7#logo%20usage')
		expect(target?.page.id).toBe(7)

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

		const preview = await getGuidelinePagePreview(7, { id: 1 } as never)

		expect(preview?.pages).toHaveLength(1)
		expect(preview?.pages[0]?.title).toBe('Logo Usage')
	})
})
