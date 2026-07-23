import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { GlobalHeader } from './global-header'

vi.stubGlobal(
	'ResizeObserver',
	class {
		disconnect() {}
		observe() {}
		unobserve() {}
	},
)

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
	it('Guideline과 Studio를 같은 메가 메뉴 형식으로 표시한다', () => {
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

		const guidelineTrigger = screen.getByRole('button', { name: 'Guideline' })
		const studioTrigger = screen.getByRole('button', { name: 'Studio' })
		const primaryNavigation = screen.getByRole('navigation', { name: '주요 메뉴' })
		const fontSizeClass = /\btext-(?:xs|sm|base|lg|[2-9]?xl)(?:\/\S+)?\b/
		const fontWeightClass =
			/\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/
		const adminLink = screen.getByRole('link', { name: 'Admin ↗' })

		expect(primaryNavigation.parentElement?.className).toMatch(fontSizeClass)
		expect(primaryNavigation.parentElement?.className).toMatch(fontWeightClass)
		expect(primaryNavigation.className).not.toMatch(fontWeightClass)
		expect(guidelineTrigger.className).not.toMatch(fontSizeClass)
		expect(guidelineTrigger.className).not.toMatch(fontWeightClass)
		expect(studioTrigger.className).not.toMatch(fontSizeClass)
		expect(studioTrigger.className).not.toMatch(fontWeightClass)
		expect(guidelineTrigger.querySelector('svg')).toBeNull()
		expect(studioTrigger.querySelector('svg')).toBeNull()
		expect(adminLink.className).not.toMatch(fontSizeClass)
		expect(adminLink.className).not.toMatch(fontWeightClass)

		fireEvent.click(guidelineTrigger)
		const guidelineContent = screen
			.getByText('브랜드의 원칙과 제작 기준을 탐색합니다.')
			.closest('[data-slot="navigation-menu-content"]')
		expect(guidelineContent).toBeVisible()
		expect(guidelineContent?.className).toContain('fade-in')
		expect(guidelineContent?.className).not.toContain('slide-in-from')
		expect(guidelineContent?.className).not.toContain('slide-out-to')
		expect(screen.getByRole('link', { name: /Foundations/ })).toHaveAttribute(
			'href',
			'/guideline/foundations',
		)

		fireEvent.click(studioTrigger)
		expect(screen.getByText('브랜드 자산을 활용해 결과물을 제작하고 검수합니다.')).toBeVisible()
		expect(screen.getByRole('link', { name: 'Templates' })).toHaveAttribute('href', '/create')
		expect(screen.getByRole('link', { name: 'Generate' })).toHaveAttribute('href', '/generate')
		expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/review')

		fireEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }))
		expect(screen.queryByRole('button', { name: '메뉴 닫기' })).not.toBeInTheDocument()
	})
})
