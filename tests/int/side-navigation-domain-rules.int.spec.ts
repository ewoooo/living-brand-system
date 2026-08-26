import { describe, expect, it } from 'vitest'
import { getGuidelineTopicPages } from '@/features/guideline/components/globals/guideline-topic-pages'

describe('side navigation domain composition', () => {
	it('folds guideline topics with one same-title page', () => {
		expect(
			getGuidelineTopicPages({
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
