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

	it('발행된 부모가 없는 draft chapter·topic을 preview한다', async () => {
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
		vi.mocked(findDraftGuidelineDocumentById).mockImplementation(async (id) =>
			id === 1 ? (chapter as never) : (topic as never),
		)
		vi.mocked(listDraftGuidelineChildren).mockResolvedValue([topic] as never)

		const target = await getGuidelineDocumentPreviewTarget(2, { id: 1 } as never)

		// #앵커 금지: 동일 출처 iframe(Better Editor)에서 앵커가 부모 admin 문서까지 스크롤시킨다.
		expect(target?.href).toBe('/guideline/brand-system/basics?previewDocument=2')

		await expect(getGuidelineChapterPreview(1, { id: 1 } as never)).resolves.toMatchObject({
			title: 'Draft Brand System',
			topics: [{ title: 'Draft Basics', slug: 'basics' }],
		})
		await expect(getGuidelineTopicPreview(2, { id: 1 } as never)).resolves.toMatchObject({
			title: 'Draft Basics',
			blocks: [],
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

	it('chapter 하위 문서 조회 실패를 null로 숨기지 않는다', async () => {
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

		// 토픽 preview는 하위 문서를 읽지 않는다 — 꼭지가 자기 본문 안의 블록이기 때문이다.
		vi.mocked(findDraftGuidelineDocumentById).mockRejectedValueOnce(new Error('topic db down'))
		await expect(getGuidelineTopicPreview(2, { id: 1 } as never)).rejects.toThrow(
			'topic db down',
		)
	})
})
