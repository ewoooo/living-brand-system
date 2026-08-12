import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	assertImageProfileUnpinned,
	assertTemplateCategoryDeletable,
	isUnpublishTransition,
	templateAssetReferenceGuardHooks,
} from './guard-template-references.service'

const repository = vi.hoisted(() => ({
	countTemplatesByCategory: vi.fn(),
	findTemplateAssetFilename: vi.fn(),
	listPublishedTemplates: vi.fn(),
}))

vi.mock(
	'@/features/template-core/repositories/template-reference.payload.repository',
	() => repository,
)

function mockReq({
	templates = [] as unknown[],
	filename = 'logo.svg',
	totalDocs = 0,
	query = {} as Record<string, unknown>,
} = {}) {
	repository.listPublishedTemplates.mockResolvedValue(templates)
	repository.findTemplateAssetFilename.mockResolvedValue(filename)
	repository.countTemplatesByCategory.mockResolvedValue(totalDocs)
	return { query } as never
}

const publishedTemplate = {
	id: 10,
	name: '인스타 배너',
	html: '<img src="/api/brand-logos/file/logo.svg">',
	overrides: { '1:1': { imageInput: { profileId: 7 } } },
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('templateAssetReferenceGuardHooks', () => {
	const hooks = templateAssetReferenceGuardHooks('brand-logos')
	const beforeDelete = hooks?.beforeDelete?.[0]
	const beforeChange = hooks?.beforeChange?.[0]

	it('발행 템플릿이 파일 URL을 참조하면 삭제를 템플릿 이름과 함께 거부한다', async () => {
		const req = mockReq({ templates: [publishedTemplate] })
		await expect(beforeDelete?.({ id: 1, req } as never)).rejects.toThrow(/인스타 배너.*삭제/)
	})

	it('참조가 없으면 삭제를 통과시킨다', async () => {
		const req = mockReq({ templates: [publishedTemplate], filename: 'unused.svg' })
		await expect(beforeDelete?.({ id: 1, req } as never)).resolves.toBeUndefined()
	})

	it('참조 중인 파일의 published→draft 전환(발행 해제)을 거부한다', async () => {
		const req = mockReq({ templates: [publishedTemplate] })
		await expect(
			beforeChange?.({
				data: { _status: 'draft' },
				originalDoc: { _status: 'published', filename: 'logo.svg' },
				req,
			} as never),
		).rejects.toThrow(/발행 해제/)
	})

	it('발행본을 유지하는 Save Draft(?draft=true)는 막지 않는다', async () => {
		const req = mockReq({ templates: [publishedTemplate], query: { draft: 'true' } })
		await expect(
			beforeChange?.({
				data: { _status: 'draft' },
				originalDoc: { _status: 'published', filename: 'logo.svg' },
				req,
			} as never),
		).resolves.toEqual({ _status: 'draft' })
	})
})

describe('isUnpublishTransition', () => {
	it('발행 행을 내리는 전환만 참이다', () => {
		const req = { query: {} } as never
		expect(
			isUnpublishTransition({
				data: { _status: 'draft' },
				originalDoc: { _status: 'published' },
				req,
			}),
		).toBe(true)
		expect(
			isUnpublishTransition({
				data: { _status: 'published' },
				originalDoc: { _status: 'published' },
				req,
			}),
		).toBe(false)
		expect(isUnpublishTransition({ data: { _status: 'draft' }, originalDoc: null, req })).toBe(
			false,
		)
	})
})

describe('assertImageProfileUnpinned', () => {
	it('발행 템플릿 overrides가 고정한 프로파일이면 거부한다', async () => {
		const req = mockReq({ templates: [publishedTemplate] })
		await expect(assertImageProfileUnpinned(req, 7, '삭제')).rejects.toThrow(/인스타 배너/)
	})

	it('고정하지 않은 프로파일은 통과시킨다', async () => {
		const req = mockReq({ templates: [publishedTemplate] })
		await expect(assertImageProfileUnpinned(req, 8, '삭제')).resolves.toBeUndefined()
	})
})

describe('assertTemplateCategoryDeletable', () => {
	it('참조 템플릿이 있으면 건수와 함께 거부한다', async () => {
		const req = mockReq({ totalDocs: 2 })
		await expect(assertTemplateCategoryDeletable(req, 1)).rejects.toThrow(/2건/)
	})

	it('참조가 없으면 통과시킨다', async () => {
		const req = mockReq({ totalDocs: 0 })
		await expect(assertTemplateCategoryDeletable(req, 1)).resolves.toBeUndefined()
	})
})
