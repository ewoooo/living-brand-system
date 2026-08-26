import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	hasGuidelineDocumentSlugConflict,
	listEditableGuidelineDocuments,
	listGuidelineChapterOptions,
} from './guideline-document.payload.repository'

describe('guideline-document Payload repository', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('Admin 목록 조회를 표시 필드와 chapter ID로 정규화한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					id: 3,
					title: '토픽',
					chapter: { id: 2 },
					displayOrder: 1,
					_status: 'draft',
					blocks: [{ blockType: 'ignored' }],
				},
			],
		})
		const payload = { find } as never

		await expect(listEditableGuidelineDocuments(payload, { user: null })).resolves.toEqual([
			{ id: 3, title: '토픽', chapter: 2, displayOrder: 1, _status: 'draft' },
		])
	})

	it('챕터 이름표를 표시 순서대로 읽는다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [{ id: 1, title: 'Brand Elements', slug: 'brand-elements', displayOrder: 0 }],
		})

		await expect(
			listGuidelineChapterOptions({ find } as never, { user: null }),
		).resolves.toEqual([{ id: 1, title: 'Brand Elements' }])
		expect(find).toHaveBeenCalledWith(expect.objectContaining({ sort: 'displayOrder' }))
	})

	// 🔴 slug는 챕터 안에서만 고유하다 — 다른 챕터에 같은 slug가 있어도 충돌이 아니다.
	it('slug 충돌 query를 챕터 스코프로 가둔다', async () => {
		const find = vi.fn().mockResolvedValue({ docs: [{ id: 9 }] })
		const req = { locale: 'ko', payload: { find }, user: { id: 7 } } as never

		await expect(
			hasGuidelineDocumentSlugConflict(req, { slug: 'logo', chapterId: 2, currentId: 7 }),
		).resolves.toBe(true)
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					and: [
						{ slug: { equals: 'logo' } },
						{ chapter: { equals: 2 } },
						{ id: { not_equals: 7 } },
					],
				},
			}),
		)
	})
})
