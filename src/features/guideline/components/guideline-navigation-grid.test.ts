import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { GuidelineNavigationGrid } from './guideline-navigation-grid'

describe('GuidelineNavigationGrid', () => {
	it('모든 탐색 항목을 요청한 제목 단계의 링크로 렌더링한다', () => {
		render(
			createElement(GuidelineNavigationGrid, {
				headingAs: 'h3',
				items: [
					{ id: 1, title: 'Color', href: '/guideline/identity/color' },
					{ id: 2, title: 'Typography', href: '/guideline/identity/typography' },
				],
			}),
		)

		expect(screen.getAllByRole('link')).toHaveLength(2)
		expect(screen.getByRole('heading', { level: 3, name: 'Color' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Typography' })).toHaveAttribute(
			'href',
			'/guideline/identity/typography',
		)
	})
})
