import { getPayload } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
	listGuidelineDocuments,
	searchGuidelineDocuments,
} from './agent-guideline-context.payload.repository'

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn() }))

describe('listGuidelineDocuments', () => {
	it('Agent 경로는 기존 ko → en fallback과 published 필터를 유지한다', async () => {
		const find = vi.fn().mockResolvedValue({ docs: [] })
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await listGuidelineDocuments({ id: 1 })

		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: 'guideline-documents',
				draft: false,
				fallbackLocale: 'en',
				locale: 'ko',
			}),
		)
		expect(find.mock.calls[0]?.[0]).not.toHaveProperty('where')
	})
})

describe('searchGuidelineDocuments', () => {
	it('정확·확장 검색 결과를 합쳐 제목 일치순으로 반환한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					title: 'Brand Product',
					doc: { relationTo: 'guideline-documents', value: 54 },
				},
				{
					title: 'Brand Model',
					doc: { relationTo: 'guideline-documents', value: 55 },
				},
			],
		})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await expect(searchGuidelineDocuments({ id: 1 }, 'Brand Model')).resolves.toEqual([
			{ title: 'Brand Model', collection: 'guideline-documents', id: '55' },
			{ title: 'Brand Product', collection: 'guideline-documents', id: '54' },
		])
		expect(find).toHaveBeenCalledTimes(2)
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					or: [
						{ title: { like: 'Brand Model' } },
						{ searchText: { like: 'Brand Model' } },
					],
				},
			}),
		)
	})

	it('정확 일치가 일부 있어도 각 검색어의 부분 일치 결과를 보충한다', async () => {
		const find = vi
			.fn()
			.mockResolvedValueOnce({
				docs: [
					{
						title: 'Brand Contents',
						doc: { relationTo: 'guideline-documents', value: 60 },
					},
				],
			})
			.mockResolvedValueOnce({
				docs: [
					{
						title: 'Brand Model',
						doc: { relationTo: 'guideline-documents', value: 55 },
					},
				],
			})
		vi.mocked(getPayload).mockResolvedValue({ find } as never)

		await expect(searchGuidelineDocuments({ id: 1 }, '모델 사진')).resolves.toEqual([
			{ title: 'Brand Contents', collection: 'guideline-documents', id: '60' },
			{ title: 'Brand Model', collection: 'guideline-documents', id: '55' },
		])
		expect(find).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				where: {
					or: [
						{ title: { contains: '모델' } },
						{ searchText: { contains: '모델' } },
						{ title: { contains: '사진' } },
						{ searchText: { contains: '사진' } },
					],
				},
			}),
		)
	})
})
