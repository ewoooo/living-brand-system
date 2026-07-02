import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findPublishedTemplate,
	listPublishedTemplateNavItems,
	listTemplateCategories,
} from '@/features/asset-generation/repositories/published-template.payload.repository'
import { getCreateNavigation } from '@/features/asset-generation/services/get-create-navigation.service'
import { getPublishedTemplate } from '@/features/asset-generation/services/get-published-template.service'

vi.mock('@/features/asset-generation/repositories/published-template.payload.repository', () => ({
	findPublishedTemplate: vi.fn(),
	listPublishedTemplateNavItems: vi.fn(),
	listTemplateCategories: vi.fn(),
}))

const mockedFind = vi.mocked(findPublishedTemplate)
const mockedNavItems = vi.mocked(listPublishedTemplateNavItems)
const mockedCategories = vi.mocked(listTemplateCategories)

const validJsonTemplate = {
	width: 1080,
	height: 1350,
	background: '#ffffff',
	elements: [],
}

describe('getCreateNavigation', () => {
	beforeEach(() => {
		mockedCategories.mockReset()
		mockedNavItems.mockReset()
	})

	it('카테고리 → 템플릿 관계로 목차를 만든다', async () => {
		mockedCategories.mockResolvedValue([
			{ id: 1, title: '배너', slug: 'banner' },
			{ id: 2, title: '포스터', slug: 'poster' },
		] as never)
		mockedNavItems.mockResolvedValue([
			{ id: 10, name: '인스타 배너', category: 1 },
			{ id: 11, name: 'A4 포스터', category: 2 },
			{ id: 12, name: '세로 배너', category: 1 },
		] as never)

		const navigation = await getCreateNavigation()

		expect(navigation.categories).toMatchObject([
			{
				title: '배너',
				href: '/create/banner',
				templates: [
					{ id: 10, href: '/create/banner/10' },
					{ id: 12, href: '/create/banner/12' },
				],
			},
			{
				title: '포스터',
				href: '/create/poster',
				templates: [{ id: 11, href: '/create/poster/11' }],
			},
		])
	})

	it('조회 실패 시 빈 목차로 폴백한다', async () => {
		mockedCategories.mockRejectedValue(new Error('db down'))
		mockedNavItems.mockResolvedValue([] as never)

		await expect(getCreateNavigation()).resolves.toEqual({ categories: [] })
	})
})

describe('getPublishedTemplate', () => {
	beforeEach(() => {
		mockedFind.mockReset()
	})

	it('스키마에 맞는 템플릿을 돌려준다', async () => {
		mockedFind.mockResolvedValue({
			id: 1,
			name: '정상 템플릿',
			jsonTemplate: validJsonTemplate,
		} as never)

		await expect(getPublishedTemplate(1)).resolves.toMatchObject({
			id: 1,
			name: '정상 템플릿',
		})
	})

	it('손으로 고치다 깨진 템플릿은 없는 것으로 처리한다', async () => {
		mockedFind.mockResolvedValue({
			id: 2,
			name: '깨진 템플릿',
			jsonTemplate: { width: 'broken' },
		} as never)

		await expect(getPublishedTemplate(2)).resolves.toBeNull()
	})

	it('없거나 조회에 실패하면 null로 폴백한다', async () => {
		mockedFind.mockResolvedValue(null as never)
		await expect(getPublishedTemplate(3)).resolves.toBeNull()

		mockedFind.mockRejectedValue(new Error('db down'))
		await expect(getPublishedTemplate(3)).resolves.toBeNull()
	})
})
