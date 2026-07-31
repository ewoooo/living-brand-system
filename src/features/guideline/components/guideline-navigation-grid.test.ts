import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { GuidelineNavigationGrid } from './guideline-navigation-grid'

describe('GuidelineNavigationGrid', () => {
	it('모든 탐색 항목을 제목 링크로 렌더링한다', () => {
		render(
			createElement(GuidelineNavigationGrid, {
				variant: 'prominent',
				items: [
					{ id: 1, title: 'Color', href: '/guideline/identity/color' },
					{ id: 2, title: 'Typography', href: '/guideline/identity/typography' },
				],
			}),
		)

		expect(screen.getAllByRole('link')).toHaveLength(2)
		expect(screen.getByRole('heading', { level: 3, name: 'Color' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Color' })).toHaveClass('md:aspect-[2/1]')
		expect(screen.getByRole('link', { name: 'Typography' })).toHaveAttribute(
			'href',
			'/guideline/identity/typography',
		)
	})
})
