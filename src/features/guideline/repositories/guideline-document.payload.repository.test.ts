import { getParents } from '@payloadcms/plugin-nested-docs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	getGuidelineRuleCheckerSummary,
	hasGuidelineDocumentSlugConflict,
	listEditableGuidelineDocuments,
	listGuidelineCheckContainers,
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

	it('Check 컨테이너에서 저장 메타데이터를 제거한다', async () => {
		const find = vi.fn().mockResolvedValue({
			docs: [
				{
					id: 10,
					blocks: [{ checks: [{ key: 'logo' }] }],
					checks: [{ key: 'color' }],
					createdAt: 'ignored',
				},
			],
		})
		const req = { payload: { find }, user: { id: 7 } } as never

		await expect(listGuidelineCheckContainers(req)).resolves.toEqual([
			{
				id: 10,
				blocks: [{ checks: [{ key: 'logo' }] }],
				checks: [{ key: 'color' }],
			},
		])
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

	it('slug 충돌 query와 Rule Checker 요약 반환을 저장소에 가둔다', async () => {
		const find = vi.fn().mockResolvedValue({ docs: [{ id: 9 }] })
		const findByID = vi.fn().mockResolvedValue({
			checkerKey: 'contrast',
			executor: 'deterministic',
			implementationKey: 'ignored',
		})
		const user = { id: 7 }
		const req = { locale: 'ko', payload: { find, findByID }, user } as never

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
		await expect(getGuidelineRuleCheckerSummary(req, 4)).resolves.toEqual({
			checkerKey: 'contrast',
			executor: 'deterministic',
		})
		expect(findByID).toHaveBeenCalledWith(
			expect.objectContaining({ overrideAccess: false, req, user }),
		)
	})
})
