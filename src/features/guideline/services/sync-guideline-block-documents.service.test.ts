import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { syncGuidelineBlockDocuments } from './sync-guideline-block-documents.service'

describe('syncGuidelineBlockDocuments', () => {
	it('현재 block은 갱신하고 새 block은 생성하며 사라진 block은 삭제한다', async () => {
		const update = vi.fn()
		const create = vi.fn()
		const remove = vi.fn()
		const req = {
			payload: {
				find: vi.fn().mockResolvedValue({
					docs: [
						{ id: 1, key: 'guideline-pages:7:current' },
						{ id: 2, key: 'guideline-pages:7:stale' },
					],
				}),
				update,
				create,
				delete: remove,
			},
		} as unknown as PayloadRequest

		await syncGuidelineBlockDocuments({
			collection: 'guideline-pages',
			doc: {
				id: 7,
				_status: 'published',
				blocks: [
					{ id: 'current', blockType: 'mediaShowcase' },
					{ id: 'new', blockType: 'columnUnit' },
				] as never,
			},
			req,
		})

		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({ collection: 'guideline-blocks', id: 1 }),
		)
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'guideline-blocks',
				data: expect.objectContaining({ key: 'guideline-pages:7:new', displayOrder: 1 }),
			}),
		)
		expect(remove).toHaveBeenCalledWith(
			expect.objectContaining({ collection: 'guideline-blocks', id: 2 }),
		)
	})
})
