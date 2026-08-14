import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findPublishedTemplate,
	listPublishedTemplateNavItems,
	listTemplateCategories,
} from '@/features/template-core/repositories/published-template.payload.repository'
import { getCreateNavigation } from '@/features/template-customization/services/get-create-navigation.service'
import { getPublishedTemplate } from '@/features/template-customization/services/get-published-template.service'

vi.mock('@/features/template-core/repositories/published-template.payload.repository', () => ({
	findPublishedTemplate: vi.fn(),
	listPublishedTemplateNavItems: vi.fn(),
	listTemplateCategories: vi.fn(),
}))

const mockedFind = vi.mocked(findPublishedTemplate)
const mockedNavItems = vi.mocked(listPublishedTemplateNavItems)
const mockedCategories = vi.mocked(listTemplateCategories)

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
			{
				id: 10,
				name: '인스타 배너',
				category: 1,
				html: '<div data-node-id="10">인스타 배너</div>',
				overrides: {},
				width: 1080,
				height: 1080,
			},
			{
				id: 11,
				name: 'A4 포스터',
				category: 2,
				html: '<div data-node-id="11">A4 포스터</div>',
				overrides: {},
				width: 2480,
				height: 3508,
			},
			{
				id: 12,
				name: '세로 배너',
				category: 1,
				html: '<div data-node-id="12">세로 배너</div>',
				overrides: {},
				width: 1080,
				height: 1920,
			},
			{ id: 13, name: '과거 템플릿', category: 1, html: null, width: null, height: null },
		] as never)

		const navigation = await getCreateNavigation()

		expect(navigation.categories).toMatchObject([
			{
				title: '배너',
				href: '/studio/template/banner',
				templates: [
					{ id: 10, href: '/studio/template/banner/10' },
					{ id: 12, href: '/studio/template/banner/12' },
				],
			},
			{
				title: '포스터',
				href: '/studio/template/poster',
				templates: [{ id: 11, href: '/studio/template/poster/11' }],
			},
		])
	})

	it('조회 실패를 빈 목차로 숨기지 않는다', async () => {
		mockedCategories.mockRejectedValue(new Error('db down'))
		mockedNavItems.mockResolvedValue([] as never)

		await expect(getCreateNavigation()).rejects.toThrow('db down')
	})
})

describe('getPublishedTemplate', () => {
	beforeEach(() => {
		mockedFind.mockReset()
	})

	it('렌더 가능한 HTML 템플릿을 돌려준다', async () => {
		mockedFind.mockResolvedValue({
			id: 1,
			name: 'Figma 템플릿',
			html: '<p data-node-id="2:1">Figma</p>',
			overrides: { '2:1': { input: { label: '이름' } } },
			width: 1280,
			height: 720,
			updatedAt: '2026-07-29T00:00:00.000Z',
		} as never)

		await expect(getPublishedTemplate('published-template')).resolves.toEqual({
			kind: 'html',
			id: 1,
			name: 'Figma 템플릿',
			html: '<p data-node-id="2:1">Figma</p>',
			nodeConfigs: { '2:1': { input: { label: '이름' } } },
			width: 1280,
			height: 720,
			printPpi: undefined,
			templateVersion: '2026-07-29T00:00:00.000Z',
		})
	})

	it('게이트 도입 전 published HTML도 렌더 직전에 fail-closed 한다', async () => {
		mockedFind.mockResolvedValue({
			id: 4,
			name: '과거 템플릿',
			html: '<img data-node-id="logo" src="x" onerror="alert(1)">',
			overrides: {},
			width: 1280,
			height: 720,
		} as never)

		await expect(getPublishedTemplate('draft-template')).resolves.toBeNull()
	})

	it('과거 문서의 자기신고 에셋도 공식 내부 URL이 아니면 렌더하지 않는다', async () => {
		mockedFind.mockResolvedValue({
			id: 5,
			name: '과거 외부 에셋 템플릿',
			html: '<img data-node-id="logo" data-asset-collection="brand-logos" data-asset-id="1" src="https://attacker.example/pixel.png">',
			overrides: {},
			width: 1280,
			height: 720,
		} as never)

		await expect(getPublishedTemplate('unrenderable-template')).resolves.toBeNull()
	})

	it('사용 가능한 HTML이 없으면 노출하지 않는다', async () => {
		mockedFind.mockResolvedValue({
			id: 2,
			name: '크기 없는 템플릿',
			html: '<div>크기 없음</div>',
		} as never)

		await expect(getPublishedTemplate('sizeless-template')).resolves.toBeNull()
	})

	it('실제로 없으면 null을 돌려주고 조회 실패는 숨기지 않는다', async () => {
		mockedFind.mockResolvedValue(null as never)
		await expect(getPublishedTemplate('missing-template')).resolves.toBeNull()

		mockedFind.mockRejectedValue(new Error('db down'))
		await expect(getPublishedTemplate('missing-template')).rejects.toThrow('db down')
	})
})
