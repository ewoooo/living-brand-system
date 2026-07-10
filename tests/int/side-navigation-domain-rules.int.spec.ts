import { describe, expect, it } from 'vitest'
import { groupCheckSectionsByChapter } from '@/features/asset-check/components/check-side-navigation'
import { getGuidelineSectionPages } from '@/features/guideline/components/guideline-side-navigation'

describe('side navigation domain composition', () => {
	it('folds guideline sections with one same-title page', () => {
		expect(
			getGuidelineSectionPages({
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
			}),
		).toEqual([])
	})

	it('groups check pages as chapter, section, and check navigation', () => {
		expect(
			groupCheckSectionsByChapter([
				{
					title: 'Primary Logo',
					slug: 'primary-logo',
					chapterTitle: 'Brand Design Elements',
					chapterSlug: 'brand-design-elements',
					sectionTitle: 'Brand Logo',
					sectionSlug: 'brand-logo',
					checks: [
						{
							key: 'logo.size.minimum',
							title: 'Minimum Size',
							executor: 'deterministic',
							implemented: true,
							evidence: '',
							referenceAssets: [],
						},
					],
				},
			]),
		).toMatchObject([
			{
				title: 'Brand Design Elements',
				sections: [
					{
						title: 'Brand Logo',
						href: '/review/rules#primary-logo',
						checks: [
							{
								title: 'Minimum Size',
								href: '/review/rules#primary-logo:logo.size.minimum',
							},
						],
					},
				],
			},
		])
	})
})
