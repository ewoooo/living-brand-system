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

function setup(category: unknown) {
	mocks.listTemplateCategories.mockResolvedValue([{ id: 7, title: '카드', slug: 'cards' }])
	mocks.listPublishedTemplateNavItems.mockResolvedValue([
		{ id: 1, name: '환영 카드', slug: 'welcome-card', category, ...renderable },
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

	// 🔴 미리보기 이미지를 채우려면 조회가 depth 1이어야 하고, 그러면 category가 id가 아니라
	// populate된 문서로 온다. id로만 비교하면 모든 카테고리가 비어 "템플릿이 없습니다"가 된다.
	it('category가 populate된 문서로 와도 같은 카테고리로 묶는다', async () => {
		const navigation = await setup({ id: 7, title: '카드', slug: 'cards' })

		expect(navigation.categories[0]?.templates.map((template) => template.slug)).toEqual([
			'welcome-card',
		])
	})

	it('다른 카테고리의 템플릿은 섞이지 않는다', async () => {
		const navigation = await setup({ id: 9, title: '포스터', slug: 'posters' })

		expect(navigation.categories[0]?.templates).toEqual([])
	})

	it('populate된 미리보기 이미지를 표시 계약으로 좁힌다', async () => {
		mocks.listTemplateCategories.mockResolvedValue([{ id: 7, title: '카드', slug: 'cards' }])
		mocks.listPublishedTemplateNavItems.mockResolvedValue([
			{
				id: 1,
				name: '환영 카드',
				slug: 'welcome-card',
				category: 7,
				previewImage: {
					url: '/media/card.png',
					alt: '환영 카드 미리보기',
					sizes: { thumbnail: { url: '/media/card-320x240.png' } },
				},
				...renderable,
			},
		])

		const navigation = await getCreateNavigation()

		expect(navigation.categories[0]?.templates[0]?.previewImage).toEqual({
			url: '/media/card-320x240.png',
			alt: '환영 카드 미리보기',
		})
	})
})
