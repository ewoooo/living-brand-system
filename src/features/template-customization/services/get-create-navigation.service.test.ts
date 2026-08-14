import { describe, expect, it, vi } from 'vitest'
import { getCreateNavigation } from './get-create-navigation.service'

const mocks = vi.hoisted(() => ({
	listPublishedTemplateNavItems: vi.fn(),
	listTemplateCategories: vi.fn(),
}))

vi.mock('@/features/template-core/repositories/published-template.payload.repository', () => ({
	listPublishedTemplateNavItems: mocks.listPublishedTemplateNavItems,
	listTemplateCategories: mocks.listTemplateCategories,
}))

const renderable = {
	html: '<p data-node-id="title">제목</p>',
	overrides: {},
	width: 400,
	height: 300,
}

function setup(categoryId: number | undefined, previewImage?: unknown) {
	mocks.listTemplateCategories.mockResolvedValue([{ id: 7, title: '카드', slug: 'cards' }])
	mocks.listPublishedTemplateNavItems.mockResolvedValue([
		{ id: 1, name: '환영 카드', slug: 'welcome-card', categoryId, previewImage, ...renderable },
	])
	return getCreateNavigation()
}

describe('getCreateNavigation', () => {
	it('카테고리 id로 템플릿을 묶는다', async () => {
		const navigation = await setup(7)

		expect(navigation.categories[0]?.templates).toEqual([
			{
				id: 1,
				name: '환영 카드',
				slug: 'welcome-card',
				href: '/studio/template/welcome-card',
				previewImage: undefined,
			},
		])
	})

	it('다른 카테고리의 템플릿은 섞이지 않는다', async () => {
		expect((await setup(9)).categories[0]?.templates).toEqual([])
	})

	// 관계를 좁히지 못한 템플릿은 어느 카테고리에도 붙지 않는다 — 0번 카테고리로 흘러들지 않는다.
	it('categoryId를 읽을 수 없는 템플릿은 어느 카테고리에도 넣지 않는다', async () => {
		expect((await setup(undefined)).categories[0]?.templates).toEqual([])
	})

	it('저장소가 좁혀 준 미리보기 이미지를 그대로 싣는다', async () => {
		const previewImage = { url: '/media/card-320x240.png', alt: '환영 카드 미리보기' }
		const navigation = await setup(7, previewImage)

		expect(navigation.categories[0]?.templates[0]?.previewImage).toEqual(previewImage)
	})
})
