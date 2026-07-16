import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { StudioSideNavigation } from './studio-side-navigation'

vi.mock('@/components/global/side-nav/side-nav', () => ({
	SideNav: ({ children }: { children: ReactNode }) => createElement('nav', {}, children),
	SideNavGroup: ({
		children,
		title,
		titleHref,
	}: {
		children: ReactNode
		title: string
		titleHref: string
	}) => createElement('div', {}, createElement('a', { href: titleHref }, title), children),
	SideNavBranch: ({ children, label }: { children: ReactNode; label: string }) =>
		createElement('section', {}, createElement('span', {}, label), children),
	SideNavItem: ({ href, label }: { href: string; label: string }) =>
		createElement('a', { href }, label),
	SideNavSubItem: ({ href, label }: { href: string; label: string }) =>
		createElement('a', { href }, label),
}))

describe('StudioSideNavigation', () => {
	it('Studio 진입점과 템플릿을 함께 표시한다', () => {
		render(
			createElement(StudioSideNavigation, {
				navigation: {
					categories: [
						{
							id: 1,
							title: 'Cards',
							slug: 'cards',
							href: '/create/cards',
							templates: [{ id: 2, name: 'Business Card', href: '/create/cards/2' }],
						},
					],
				},
			}),
		)

		expect(screen.getByRole('link', { name: 'Template' })).toHaveAttribute('href', '/create')
		expect(screen.getByRole('link', { name: 'Generate' })).toHaveAttribute('href', '/generate')
		expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/review')
		expect(screen.getByText('Cards')).toBeTruthy()
		expect(screen.getByRole('link', { name: 'Business Card' })).toHaveAttribute(
			'href',
			'/create/cards/2',
		)
	})
})
