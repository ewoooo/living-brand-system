import { describe, expect, it } from 'vitest'
import { toCheckSideNavGroups } from '@/features/asset-check/components/check-side-navigation'
import { toCreateSideNavGroups } from '@/features/asset-generation/components/create-side-navigation'
import { toGuidelineSideNavGroups } from '@/features/guideline/components/guideline-side-navigation'

describe('side navigation mappers', () => {
	it('folds guideline sections with one same-title page', () => {
		expect(
			toGuidelineSideNavGroups({
				metadata: {
					companyName: 'Essenherb',
					documentTitle: 'Guideline',
					faviconHref: null,
					issuedLabel: null,
				},
				title: 'Guideline',
				chapters: [
					{
						id: 1,
						title: 'Brand Strategy',
						description: null,
						href: '/guideline/brand-strategy',
						sections: [
							{
								id: 10,
								title: 'The Name',
								href: '/guideline/brand-strategy/the-name',
								pages: [
									{
										id: 100,
										title: 'The Name',
										href: '/guideline/brand-strategy/the-name#the-name',
									},
								],
							},
						],
					},
				],
			}),
		).toMatchObject([
			{
				title: 'Brand Strategy',
				items: [{ label: 'The Name', children: [] }],
			},
		])
	})

	it('maps create and check navigation into SideNav groups', () => {
		expect(
			toCreateSideNavGroups({
				categories: [
					{
						id: 1,
						title: 'Package',
						slug: 'package',
						href: '/create/package',
						templates: [{ id: 2, name: 'Box', href: '/create/package/2' }],
					},
				],
			}),
		).toMatchObject([{ title: 'Package', items: [{ label: 'Box' }] }])

		expect(
			toCheckSideNavGroups([
				{
					title: 'Primary Logo',
					slug: 'primary-logo',
					chapterTitle: 'Brand Design Elements',
					chapterSlug: 'brand-design-elements',
					sectionTitle: 'Brand Logo',
					sectionSlug: 'brand-logo',
				},
			]),
		).toMatchObject([
			{
				title: 'Brand Design Elements',
				items: [{ label: 'Brand Logo', children: [{ label: 'Primary Logo' }] }],
			},
		])
	})
})
