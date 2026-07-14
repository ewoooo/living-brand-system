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
	listPublishedGuidelineNavigationDocuments: vi.fn().mockResolvedValue([
		{
			id: 1,
			title: 'Basics',
			slug: 'basics-chapter-1',
			legacySlug: 'basics',
			description: null,
			parent: null,
			breadcrumbs: [{ url: '/guideline/basics', label: 'Basics', doc: 1 }],
		},
		{
			id: 10,
			title: 'Logo',
			slug: 'logo-section-10',
			legacySlug: 'logo',
			description: null,
			parent: 1,
			breadcrumbs: [{ url: '/guideline/basics/logo', label: 'Logo', doc: 10 }],
		},
		{
			id: 11,
			title: 'The Name',
			slug: 'the-name-section-11',
			legacySlug: 'the-name',
			description: null,
			parent: 1,
			breadcrumbs: [{ url: '/guideline/basics/the-name', label: 'The Name', doc: 11 }],
		},
		{
			id: 100,
			title: 'Primary Logo',
			slug: 'primary-logo-page-100',
			legacySlug: 'primary-logo',
			description: null,
			parent: 10,
			breadcrumbs: [],
		},
		{
			id: 101,
			title: 'Clear Space',
			slug: 'clear-space-page-101',
			legacySlug: 'clear-space',
			description: null,
			parent: 10,
			breadcrumbs: [],
		},
		{
			id: 102,
			title: 'The Name',
			slug: 'the-name-page-102',
			legacySlug: 'the-name',
			description: null,
			parent: 11,
			breadcrumbs: [],
		},
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
