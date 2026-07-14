import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findDraftGuidelineDocumentById,
	listDraftGuidelineChildren,
} from '../repositories/guideline-preview.payload.repository'
import {
	getGuidelineChapterPreview,
	getGuidelineDocumentPreviewTarget,
	getGuidelineSectionPreview,
} from './get-guideline-document-preview.service'

vi.mock('../repositories/guideline-preview.payload.repository', () => ({
	findDraftGuidelineDocumentById: vi.fn(),
	listDraftGuidelineChildren: vi.fn(),
}))

describe('guideline document preview', () => {
	beforeEach(() => vi.clearAllMocks())

	it('발행된 부모가 없는 draft chapter·section·page를 preview한다', async () => {
		const chapter = {
			id: 1,
			title: 'Draft Brand System',
			label: 'Draft',
			description: null,
			slug: 'brand-system',
			breadcrumbs: [{ url: '/guideline/brand-system' }],
		}
		const section = {
			id: 2,
			title: 'Draft Basics',
			slug: 'basics',
			description: null,
			headerImage: null,
			blocks: [],
			parent: 1,
			breadcrumbs: [
				{ url: '/guideline/brand-system' },
				{ url: '/guideline/brand-system/basics' },
			],
		}
		const page = {
			id: 3,
			title: 'Draft Logo Usage',
			slug: 'logo-usage',
			description: null,
			displayOrder: 1,
			blocks: [],
			parent: 2,
			breadcrumbs: [
				{ url: '/guideline/brand-system' },
				{ url: '/guideline/brand-system/basics' },
				{ url: '/guideline/brand-system/basics/logo-usage' },
			],
		}
		vi.mocked(findDraftGuidelineDocumentById).mockImplementation(async (id) => {
			if (id === 1) return chapter as never
			if (id === 2) return section as never
			return page as never
		})
		vi.mocked(listDraftGuidelineChildren).mockImplementation(async (id) => {
			if (id === 1) return [section] as never
			return [page] as never
		})

		const target = await getGuidelineDocumentPreviewTarget(3, { id: 1 } as never)

		expect(target?.href).toBe('/guideline/brand-system/basics?previewDocument=3#logo-usage')

		await expect(getGuidelineChapterPreview(1, { id: 1 } as never)).resolves.toMatchObject({
			title: 'Draft Brand System',
			sections: [{ title: 'Draft Basics', slug: 'basics' }],
		})
		await expect(getGuidelineSectionPreview(3, { id: 1 } as never)).resolves.toMatchObject({
			title: 'Draft Basics',
			pages: [{ title: 'Draft Logo Usage', slug: 'logo-usage' }],
		})
	})
})
