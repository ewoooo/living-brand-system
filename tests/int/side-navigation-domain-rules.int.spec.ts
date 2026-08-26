import { describe, expect, it } from 'vitest'
import { getGuidelineTopicSections } from '@/features/guideline/components/globals/guideline-topic-sections'

describe('side navigation domain composition', () => {
	it('folds guideline topics with one same-title section', () => {
		expect(
			getGuidelineTopicSections({
				id: 10,
				title: 'The Name',
				href: '/guideline/brand-strategy/the-name',
				sections: [
					{
						anchor: 'the-name',
						title: 'The Name',
						href: '/guideline/brand-strategy/the-name#the-name',
					},
				],
			}),
		).toEqual([])
	})
})
