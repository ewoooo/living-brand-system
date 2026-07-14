import { describe, expect, it, vi } from 'vitest'
import { buildGuidelineNavigationChapters } from './get-guideline-navigation.service'

vi.mock('../repositories/guideline-view.payload.repository', () => ({
	listPublishedGuidelineNavigationDocuments: vi.fn(),
}))
vi.mock('./get-guideline-metadata.service', () => ({ getGuidelineMetadata: vi.fn() }))

const lexical = (text: string) =>
	({ root: { children: [{ type: 'paragraph', children: [{ text }] }] } }) as never

describe('buildGuidelineNavigationChapters', () => {
	it('기존 장·섹션·페이지 구조와 같은 목차와 Page anchor URL을 만든다', () => {
		const navigation = buildGuidelineNavigationChapters([
			{
				id: 1,
				title: 'Brand',
				slug: 'brand',
				description: lexical('Brand foundation'),
				parent: null,
				breadcrumbs: [{ doc: 1, label: 'Brand', url: '/guideline/brand' }],
			},
			{
				id: 2,
				title: 'Logo',
				slug: 'logo',
				description: null,
				parent: 1,
				breadcrumbs: [
					{ doc: 1, label: 'Brand', url: '/guideline/brand' },
					{ doc: 2, label: 'Logo', url: '/guideline/brand/logo' },
				],
			},
			{
				id: 3,
				title: 'Primary Logo',
				slug: 'primary-logo',
				description: null,
				parent: 2,
				breadcrumbs: [
					{ doc: 1, label: 'Brand', url: '/guideline/brand' },
					{ doc: 2, label: 'Logo', url: '/guideline/brand/logo' },
					{ doc: 3, label: 'Primary Logo', url: '/guideline/brand/logo/primary-logo' },
				],
			},
		] as never)

		expect(navigation).toEqual([
			{
				id: 1,
				title: 'Brand',
				description: 'Brand foundation',
				href: '/guideline/brand',
				sections: [
					{
						id: 2,
						title: 'Logo',
						href: '/guideline/brand/logo',
						pages: [
							{
								id: 3,
								title: 'Primary Logo',
								href: '/guideline/brand/logo#primary-logo',
							},
						],
					},
				],
			},
		])
	})
})
