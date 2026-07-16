import { describe, expect, it } from 'vitest'
import { getGuidelineSectionPages } from '@/features/guideline/components/globals/guideline-side-navigation'

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
})
