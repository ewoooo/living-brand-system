import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { GlobalHeader } from './global-header'

vi.mock('next/navigation', () => ({
	usePathname: () => '/guideline/foundations',
}))

vi.mock('@/components/global/search/guideline-search', () => ({
	GuidelineSearch: () => null,
}))

vi.mock('@/components/ui/sidebar', () => ({
	SidebarTrigger: () => null,
}))

describe('GlobalHeader', () => {
	it('가이드라인 챕터와 Studio 링크를 표시한다', () => {
		render(
			createElement(GlobalHeader, {
				guidelineChapters: [
					{
						description: '브랜드의 기본 원칙',
						href: '/guideline/foundations',
						id: 1,
						sections: [],
						title: 'Foundations',
					},
				],
			}),
		)

		expect(screen.getByRole('link', { name: 'Guideline' })).toHaveAttribute(
			'href',
			'/guideline',
		)
		expect(screen.getByRole('link', { name: 'Studio' })).toHaveAttribute('href', '/create')

		fireEvent.click(screen.getByRole('button', { name: 'Guideline 메뉴 열기' }))

		expect(screen.getByRole('link', { name: /Foundations/ })).toHaveAttribute(
			'href',
			'/guideline/foundations',
		)
		expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/review')

		fireEvent.click(screen.getByRole('button', { name: 'Studio 메뉴 열기' }))

		expect(screen.getByRole('link', { name: 'Templates' })).toHaveAttribute('href', '/create')
		expect(screen.getByRole('link', { name: 'Generate' })).toHaveAttribute('href', '/generate')
	})
})
