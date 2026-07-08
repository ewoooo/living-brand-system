import { describe, expect, it, vi } from 'vitest'
import { getGuidelineNavigation } from '@/features/guideline/services/get-guideline-navigation.service'

vi.mock('@/features/guideline/services/get-guideline-metadata.service', () => ({
	getGuidelineMetadata: vi.fn().mockResolvedValue({
		companyName: 'Essenherb',
		documentTitle: 'Guideline',
		faviconHref: null,
		issuedLabel: null,
	}),
}))

vi.mock('@/features/guideline/repositories/guideline-view.payload.repository', () => ({
	listPublishedChapters: vi
		.fn()
		.mockResolvedValue([{ id: 1, title: 'Basics', slug: 'basics', description: null }]),
	listPublishedSectionNavItems: vi
		.fn()
		.mockResolvedValue([{ id: 10, title: 'Logo', slug: 'logo', chapter: 1 }]),
	listPublishedPageNavItems: vi.fn().mockResolvedValue([
		{ id: 100, title: 'Primary Logo', slug: 'primary-logo', section: 10 },
		{ id: 101, title: 'Clear Space', slug: 'clear-space', section: 10 },
	]),
}))

describe('getGuidelineNavigation', () => {
	it('builds chapter, section, and page navigation', async () => {
		await expect(getGuidelineNavigation()).resolves.toMatchObject({
			chapters: [
				{
					title: 'Basics',
					href: '/guideline/basics',
					sections: [
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
					],
				},
			],
		})
	})
})
