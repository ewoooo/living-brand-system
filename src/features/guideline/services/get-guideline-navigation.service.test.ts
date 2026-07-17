import { describe, expect, it, vi } from 'vitest'
import { buildGuidelineNavigationChapters } from './get-guideline-navigation.service'

vi.mock('../repositories/guideline-view.payload.repository', () => ({
	listPublishedGuidelineNavigationDocuments: vi.fn(),
}))
vi.mock('./get-guideline-metadata.service', () => ({ getGuidelineMetadata: vi.fn() }))

describe('buildGuidelineNavigationChapters', () => {
	it('기존 장·섹션·페이지 구조와 같은 목차와 Page anchor URL을 만든다', () => {
		const navigation = buildGuidelineNavigationChapters([
			{
				id: 1,
				title: 'Brand',
				slug: 'brand',
				description: 'Brand foundation',
				parentId: null,
				href: '/guideline/brand',
			},
			{
				id: 2,
				title: 'Logo',
				slug: 'logo',
				description: null,
				parentId: 1,
				href: '/guideline/brand/logo',
			},
			{
				id: 3,
				title: 'Primary Logo',
				slug: 'primary-logo',
				description: null,
				parentId: 2,
				href: '/guideline/brand/logo/primary-logo',
			},
		])

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
