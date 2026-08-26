import { describe, expect, it, vi } from 'vitest'
import { buildGuidelineNavigationChapters } from './get-guideline-navigation.service'

vi.mock('../repositories/guideline-view.payload.repository', () => ({
	listPublishedGuidelineNavigationDocuments: vi.fn(),
}))
vi.mock('./get-guideline-metadata.service', () => ({ getGuidelineMetadata: vi.fn() }))

describe('buildGuidelineNavigationChapters', () => {
	it('장·토픽 문서와 토픽의 꼭지 블록으로 목차와 앵커 URL을 만든다', () => {
		const navigation = buildGuidelineNavigationChapters([
			{
				id: 1,
				title: 'Brand',
				slug: 'brand',
				description: 'Brand foundation',
				parentId: null,
				href: '/guideline/brand',
				sections: [],
			},
			{
				id: 2,
				title: 'Logo',
				slug: 'logo',
				description: null,
				parentId: 1,
				href: '/guideline/brand/logo',
				sections: [{ anchor: 'primary-logo', title: 'Primary Logo' }],
			},
		])

		expect(navigation).toEqual([
			{
				id: 1,
				title: 'Brand',
				description: 'Brand foundation',
				href: '/guideline/brand',
				topics: [
					{
						id: 2,
						title: 'Logo',
						href: '/guideline/brand/logo',
						sections: [
							{
								anchor: 'primary-logo',
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
