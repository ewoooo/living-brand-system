import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { GlobalHeader } from './global-header'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('next/navigation', () => ({
	usePathname: () => '/guideline/foundations',
	useRouter: () => ({ push }),
}))

vi.mock('@/components/global/search/guideline-search', () => ({
	GuidelineSearch: () => null,
}))

vi.mock('@/components/ui/sidebar', () => ({
	SidebarTrigger: () => null,
}))

describe('GlobalHeader', () => {
	it('상위 메뉴를 클릭하면 이동하고 드롭다운 링크를 표시한다', () => {
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

		fireEvent.click(screen.getByRole('button', { name: /Guideline/ }))
		expect(push).toHaveBeenLastCalledWith('/guideline')

		const foundationsLink = screen.getByRole('link', { name: /Foundations/ })
		expect(foundationsLink).toHaveAttribute('href', '/guideline/foundations')
		expect(foundationsLink).toHaveClass('in-data-[state=open]:animate-in')
		expect(foundationsLink.closest('[data-slot="navigation-menu-content"]')).toHaveAttribute(
			'data-state',
			'open',
		)
		expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/review')

		fireEvent.click(screen.getByRole('button', { name: /Studio/ }))
		expect(push).toHaveBeenLastCalledWith('/create')

		expect(screen.getByRole('link', { name: 'Templates' })).toHaveAttribute('href', '/create')
		expect(screen.getByRole('link', { name: 'Generate' })).toHaveAttribute('href', '/generate')
	})
})
