import { describe, expect, it, vi } from 'vitest'
import { validateGuidelineDocumentSlug } from './validate-guideline-document-slug'

describe('validateGuidelineDocumentSlug', () => {
	it('같은 locale·부모의 중복만 거부하고 현재 문서는 제외한다', async () => {
		const find = vi
			.fn()
			.mockResolvedValueOnce({ docs: [] })
			.mockResolvedValueOnce({ docs: [{ id: 9 }] })
		const args = {
			collection: { slug: 'guideline-documents' },
			data: { parent: 2 },
			originalDoc: { id: 7, slug: 'logo' },
			req: { locale: 'ko', payload: { find } },
			value: 'logo',
		} as never

		await expect(validateGuidelineDocumentSlug(args)).resolves.toBe('logo')
		expect(find).toHaveBeenLastCalledWith(
			expect.objectContaining({
				locale: 'ko',
				where: {
					and: [
						{ slug: { equals: 'logo' } },
						{ parent: { equals: 2 } },
						{ id: { not_equals: 7 } },
					],
				},
			}),
		)
		await expect(validateGuidelineDocumentSlug(args)).rejects.toMatchObject({
			data: { errors: [{ path: 'slug' }] },
		})
	})
})
