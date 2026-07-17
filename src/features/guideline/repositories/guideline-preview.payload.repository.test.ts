import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
	findDraftGuidelineDocumentById,
	listDraftGuidelineChildren,
} from './guideline-preview.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('findDraftGuidelineDocumentById', () => {
	it('미존재는 null로 돌려주도록 조회하고 DB 오류는 그대로 전파한다', async () => {
		const findByID = vi
			.fn()
			.mockResolvedValueOnce(null)
			.mockRejectedValueOnce(new Error('db down'))
		vi.mocked(getPayload).mockResolvedValue({ findByID } as never)

		await expect(findDraftGuidelineDocumentById(404, { id: 1 } as never)).resolves.toBeNull()
		expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ disableErrors: true }))

		await expect(findDraftGuidelineDocumentById(1, { id: 1 } as never)).rejects.toThrow(
			'db down',
		)
	})

	it('Payload 관계와 breadcrumb를 preview DTO로 변환한다', async () => {
		const document = {
			id: 3,
			title: 'Logo',
			slug: 'logo',
			parent: { id: 2, title: 'Basics' },
			breadcrumbs: [{ doc: 1, url: '/guideline/brand' }, { doc: 3 }],
			displayOrder: null,
		}
		const find = vi.fn().mockResolvedValue({ docs: [document] })
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await expect(listDraftGuidelineChildren(2, { id: 1 } as never)).resolves.toEqual([
			expect.objectContaining({
				id: 3,
				parentId: 2,
				breadcrumbs: [{ url: '/guideline/brand' }, { url: null }],
				descriptionText: null,
				displayOrder: -1,
			}),
		])
	})
})
