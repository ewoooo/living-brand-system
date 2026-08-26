import { describe, expect, it, vi } from 'vitest'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

vi.mock('@/features/guideline/services/get-guideline-metadata.service', () => ({
	getGuidelineMetadata: vi.fn().mockResolvedValue({
		companyName: 'HD현대',
		documentTitle: 'Guideline',
		faviconHref: null,
		issuedLabel: null,
	}),
}))

vi.mock('@/features/guideline/repositories/guideline-view.payload.repository', () => ({
	listPublishedGuidelineNavigationDocuments: vi.fn().mockResolvedValue([
		{
			id: 1,
			title: 'Basics',
			slug: 'basics',
			description: null,
			parentId: null,
			href: '/guideline/basics',
			sections: [],
		},
		{
			id: 10,
			title: 'Logo',
			slug: 'logo',
			description: null,
			parentId: 1,
			href: '/guideline/basics/logo',
			sections: [
				{ anchor: 'primary-logo', title: 'Primary Logo' },
				{ anchor: 'clear-space', title: 'Clear Space' },
			],
		},
		{
			id: 11,
			title: 'The Name',
			slug: 'the-name',
			description: null,
			parentId: 1,
			href: '/guideline/basics/the-name',
			sections: [{ anchor: 'the-name', title: 'The Name' }],
		},
	]),
}))

describe('getGuidelineNavigation', () => {
	it('builds chapter, topic, and section navigation', async () => {
		await expect(getGuidelineNavigation()).resolves.toMatchObject({
			chapters: [
				{
					title: 'Basics',
					href: '/guideline/basics',
					topics: [
						{
							title: 'Logo',
							href: '/guideline/basics/logo',
							sections: [
								{
									title: 'Primary Logo',
									href: '/guideline/basics/logo#primary-logo',
								},
								{
									title: 'Clear Space',
									href: '/guideline/basics/logo#clear-space',
								},
							],
						},
						{
							title: 'The Name',
							href: '/guideline/basics/the-name',
							sections: [
								{
									title: 'The Name',
									href: '/guideline/basics/the-name#the-name',
								},
							],
						},
					],
				},
			],
		})
	})
})
