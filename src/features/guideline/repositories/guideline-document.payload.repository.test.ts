import { getParents } from '@payloadcms/plugin-nested-docs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	hasGuidelineDocumentSlugConflict,
	listEditableGuidelineDocuments,
	listGuidelineDocumentAncestorIds,
	listGuidelineDocumentDescendantPaths,
} from './guideline-document.payload.repository'

vi.mock('@payloadcms/plugin-nested-docs', () => ({ getParents: vi.fn() }))

describe('guideline-document Payload repository', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('Admin tree 조회를 표시 필드와 parent ID로 정규화한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					id: 3,
					title: '페이지',
					parent: { id: 2 },
					displayOrder: 1,
					_status: 'draft',
					blocks: [{ blockType: 'ignored' }],
				},
			],
		})
		const payload = { find } as never
		const user = { id: 7 } as never

		await expect(
			listEditableGuidelineDocuments(payload, { locale: 'ko', user }),
		).resolves.toEqual([
			{ id: 3, title: '페이지', parent: 2, displayOrder: 1, _status: 'draft' },
		])
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({ overrideAccess: false, locale: 'ko', user }),
		)
	})

	it('손상된 ancestor와 breadcrumb 위치를 sentinel로 보존한다', async () => {
		vi.mocked(getParents).mockResolvedValue([{ id: 1 }, { broken: true }, { id: 3 }] as never)
		const find = vi.fn().mockResolvedValue({
			docs: [{ breadcrumbs: [{ doc: 10 }, { doc: { broken: true } }, { doc: { id: 12 } }] }],
		})
		const req = { payload: { find } } as never
		const collection = { slug: 'guideline-documents' } as never

		await expect(listGuidelineDocumentAncestorIds(req, collection, 3)).resolves.toEqual([
			1, -1, 3,
		])
		await expect(listGuidelineDocumentDescendantPaths(req, 10)).resolves.toEqual([[10, -1, 12]])
	})

	it('slug 충돌 query를 저장소에 가둔다', async () => {
		const find = vi.fn().mockResolvedValue({ docs: [{ id: 9 }] })
		const user = { id: 7 }
		const req = { locale: 'ko', payload: { find }, user } as never

		await expect(
			hasGuidelineDocumentSlugConflict(req, {
				slug: 'logo',
				parentId: 2,
				currentId: 7,
			}),
		).resolves.toBe(true)
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					and: [
						{ slug: { equals: 'logo' } },
						{ parent: { equals: 2 } },
						{ id: { not_equals: 7 } },
					],
				},
			}),
		)
	})
})
