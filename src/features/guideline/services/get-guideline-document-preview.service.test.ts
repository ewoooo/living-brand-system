import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findDraftGuidelineDocumentById,
	listDraftGuidelineChildren,
} from '../repositories/guideline-preview.payload.repository'
import {
	getGuidelineChapterPreview,
	getGuidelineDocumentPreviewTarget,
	getGuidelineTopicPreview,
} from './get-guideline-document-preview.service'

vi.mock('../repositories/guideline-preview.payload.repository', () => ({
	findDraftGuidelineDocumentById: vi.fn(),
	listDraftGuidelineChildren: vi.fn(),
}))

describe('guideline document preview', () => {
	beforeEach(() => vi.resetAllMocks())

	it('발행된 부모가 없는 draft chapter·topic·page를 preview한다', async () => {
		const chapter = {
			id: 1,
			title: 'Draft Brand System',
			label: 'Draft',
			description: null,
			descriptionText: null,
			slug: 'brand-system',
			breadcrumbs: [{ url: '/guideline/brand-system' }],
		}
		const topic = {
			id: 2,
			title: 'Draft Basics',
			slug: 'basics',
			description: null,
			descriptionText: null,
			headerImage: null,
			blocks: [],
			parentId: 1,
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
			descriptionText: null,
			displayOrder: 1,
			blocks: [],
			parentId: 2,
			breadcrumbs: [
				{ url: '/guideline/brand-system' },
				{ url: '/guideline/brand-system/basics' },
				{ url: '/guideline/brand-system/basics/logo-usage' },
			],
		}
		vi.mocked(findDraftGuidelineDocumentById).mockImplementation(async (id) => {
			if (id === 1) return chapter as never
			if (id === 2) return topic as never
			return page as never
		})
		vi.mocked(listDraftGuidelineChildren).mockImplementation(async (id) => {
			if (id === 1) return [topic] as never
			return [page] as never
		})

		const target = await getGuidelineDocumentPreviewTarget(3, { id: 1 } as never)

		// #앵커 금지: 동일 출처 iframe(Better Editor)에서 앵커가 부모 admin 문서까지 스크롤시킨다.
		expect(target?.href).toBe('/guideline/brand-system/basics?previewDocument=3')

		await expect(getGuidelineChapterPreview(1, { id: 1 } as never)).resolves.toMatchObject({
			title: 'Draft Brand System',
			topics: [{ title: 'Draft Basics', slug: 'basics' }],
		})
		await expect(getGuidelineTopicPreview(3, { id: 1 } as never)).resolves.toMatchObject({
			title: 'Draft Basics',
			pages: [{ title: 'Draft Logo Usage', slug: 'logo-usage' }],
		})
	})

	it('실제 미존재·잘못된 breadcrumb만 null로 처리하고 조회 실패는 전파한다', async () => {
		vi.mocked(findDraftGuidelineDocumentById).mockResolvedValueOnce(null)
		await expect(getGuidelineDocumentPreviewTarget(404, { id: 1 } as never)).resolves.toBeNull()

		vi.mocked(findDraftGuidelineDocumentById).mockResolvedValueOnce({
			id: 1,
			breadcrumbs: [],
		} as never)
		await expect(getGuidelineDocumentPreviewTarget(1, { id: 1 } as never)).resolves.toBeNull()

		vi.mocked(findDraftGuidelineDocumentById).mockRejectedValueOnce(new Error('db down'))
		await expect(getGuidelineDocumentPreviewTarget(1, { id: 1 } as never)).rejects.toThrow(
			'db down',
		)
	})

	it('chapter와 topic 하위 문서 조회 실패를 null로 숨기지 않는다', async () => {
		vi.mocked(findDraftGuidelineDocumentById).mockResolvedValueOnce({
			id: 1,
			title: 'Brand',
			slug: 'brand',
			breadcrumbs: [{ url: '/guideline/brand' }],
		} as never)
		vi.mocked(listDraftGuidelineChildren).mockRejectedValueOnce(new Error('chapter db down'))
		await expect(getGuidelineChapterPreview(1, { id: 1 } as never)).rejects.toThrow(
			'chapter db down',
		)

		vi.mocked(findDraftGuidelineDocumentById).mockResolvedValueOnce({
			id: 2,
			title: 'Logo',
			slug: 'logo',
			breadcrumbs: [{ url: '/guideline/brand' }, { url: '/guideline/brand/logo' }],
		} as never)
		vi.mocked(listDraftGuidelineChildren).mockRejectedValueOnce(new Error('topic db down'))
		await expect(getGuidelineTopicPreview(2, { id: 1 } as never)).rejects.toThrow(
			'topic db down',
		)
	})
})
