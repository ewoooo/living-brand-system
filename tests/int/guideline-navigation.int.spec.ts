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
		},
		{
			id: 10,
			title: 'Logo',
			slug: 'logo',
			description: null,
			parentId: 1,
			href: '/guideline/basics/logo',
		},
		{
			id: 11,
			title: 'The Name',
			slug: 'the-name',
			description: null,
			parentId: 1,
			href: '/guideline/basics/the-name',
		},
		{
			id: 100,
			title: 'Primary Logo',
			slug: 'primary-logo',
			description: null,
			parentId: 10,
			href: null,
		},
		{
			id: 101,
			title: 'Clear Space',
			slug: 'clear-space',
			description: null,
			parentId: 10,
			href: null,
		},
		{
			id: 102,
			title: 'The Name',
			slug: 'the-name',
			description: null,
			parentId: 11,
			href: null,
		},
	]),
}))

describe('getGuidelineNavigation', () => {
	it('builds chapter, topic, and page navigation', async () => {
		await expect(getGuidelineNavigation()).resolves.toMatchObject({
			chapters: [
				{
					title: 'Basics',
					href: '/guideline/basics',
					topics: [
						{
							title: 'Logo',
							href: '/guideline/basics/logo',
							pages: [
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
							pages: [
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
