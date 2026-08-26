import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	listGuidelineDocumentAncestorIds,
	listGuidelineDocumentDescendantPaths,
} from '../repositories/guideline-document.payload.repository'
import { validateGuidelineDocumentDepth } from './validate-guideline-document-depth'

vi.mock('../repositories/guideline-document.payload.repository', () => ({
	listGuidelineDocumentAncestorIds: vi.fn(),
	listGuidelineDocumentDescendantPaths: vi.fn(),
}))

const listAncestorIds = vi.mocked(listGuidelineDocumentAncestorIds)
const listDescendantPaths = vi.mocked(listGuidelineDocumentDescendantPaths)

describe('validateGuidelineDocumentDepth', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		listAncestorIds.mockResolvedValue([])
		listDescendantPaths.mockResolvedValue([])
	})

	it('챕터 아래 토픽까지 허용한다', async () => {
		const data = { parent: 1 }
		listAncestorIds.mockResolvedValue([1])

		await expect(
			validateGuidelineDocumentDepth({
				collection: { slug: 'guideline-documents' },
				data,
				operation: 'create',
				req: {},
			} as never),
		).resolves.toBe(data)
	})

	it('토픽 아래에 세 번째 단계를 만들지 못하게 한다', async () => {
		listAncestorIds.mockResolvedValue([1, 2])

		await expect(
			validateGuidelineDocumentDepth({
				collection: { slug: 'guideline-documents' },
				data: { parent: 2 },
				operation: 'create',
				req: {},
			} as never),
		).rejects.toMatchObject({
			data: {
				errors: [{ message: '가이드라인 문서는 챕터·토픽 2단계까지만 만들 수 있습니다.' }],
			},
		})
	})

	it('하위 문서를 부모로 지정해 순환시키지 못하게 한다', async () => {
		listAncestorIds.mockResolvedValue([1, 2, 3])

		await expect(
			validateGuidelineDocumentDepth({
				collection: { slug: 'guideline-documents' },
				data: { parent: 3 },
				operation: 'update',
				originalDoc: { id: 1 },
				req: {},
			} as never),
		).rejects.toMatchObject({
			data: {
				errors: [{ message: '하위 문서를 상위 문서로 지정할 수 없습니다.' }],
			},
		})
	})

	it('손상된 breadcrumb 위치가 있어도 자식 트리 깊이를 줄여 계산하지 않는다', async () => {
		listAncestorIds.mockResolvedValue([1])
		listDescendantPaths.mockResolvedValue([
			[10, 11],
			[10, -1, 12],
		])

		await expect(
			validateGuidelineDocumentDepth({
				collection: { slug: 'guideline-documents' },
				data: { parent: 1 },
				operation: 'update',
				originalDoc: { id: 10 },
				req: {},
			} as never),
		).rejects.toMatchObject({
			data: {
				errors: [{ message: '가이드라인 문서는 챕터·토픽 2단계까지만 만들 수 있습니다.' }],
			},
		})
	})
})
