import { describe, expect, it, vi } from 'vitest'
import { validateGuidelineDocumentDepth } from './validate-guideline-document-depth'

const documents = {
	1: { id: 1, parent: null },
	2: { id: 2, parent: 1 },
	3: { id: 3, parent: 2 },
}

const request = (descendants: { breadcrumbs: { doc: number }[] }[] = []) => ({
	payload: {
		findByID: vi.fn(({ id }: { id: number }) =>
			Promise.resolve(documents[id as keyof typeof documents]),
		),
		find: vi.fn().mockResolvedValue({ docs: descendants }),
	},
})

describe('validateGuidelineDocumentDepth', () => {
	it('장 아래 섹션과 페이지까지 허용한다', async () => {
		const data = { parent: 2 }

		await expect(
			validateGuidelineDocumentDepth({
				collection: { slug: 'guideline-documents' },
				data,
				operation: 'create',
				req: request(),
			} as never),
		).resolves.toBe(data)
	})

	it('페이지 아래에 네 번째 단계를 만들지 못하게 한다', async () => {
		await expect(
			validateGuidelineDocumentDepth({
				collection: { slug: 'guideline-documents' },
				data: { parent: 3 },
				operation: 'create',
				req: request(),
			} as never),
		).rejects.toMatchObject({
			data: {
				errors: [
					{ message: '가이드라인 문서는 장·섹션·페이지 3단계까지만 만들 수 있습니다.' },
				],
			},
		})
	})

	it('하위 문서를 부모로 지정해 순환시키지 못하게 한다', async () => {
		await expect(
			validateGuidelineDocumentDepth({
				collection: { slug: 'guideline-documents' },
				data: { parent: 3 },
				operation: 'update',
				originalDoc: { id: 1 },
				req: request(),
			} as never),
		).rejects.toMatchObject({
			data: {
				errors: [{ message: '하위 문서를 상위 문서로 지정할 수 없습니다.' }],
			},
		})
	})

	it('자식 트리가 있는 문서를 옮길 때 전체 트리가 3단계를 넘지 못하게 한다', async () => {
		await expect(
			validateGuidelineDocumentDepth({
				collection: { slug: 'guideline-documents' },
				data: { parent: 1 },
				operation: 'update',
				originalDoc: { id: 10 },
				req: request([
					{ breadcrumbs: [{ doc: 10 }, { doc: 11 }] },
					{ breadcrumbs: [{ doc: 10 }, { doc: 11 }, { doc: 12 }] },
				]),
			} as never),
		).rejects.toMatchObject({
			data: {
				errors: [
					{ message: '가이드라인 문서는 장·섹션·페이지 3단계까지만 만들 수 있습니다.' },
				],
			},
		})
	})
})
