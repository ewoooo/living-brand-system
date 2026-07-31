import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { StudioSideNavigation } from './studio-side-navigation'

vi.mock('next/navigation', () => ({
	usePathname: () => '/studio/template/cards/2',
}))

vi.mock('@/components/ui/sidebar', () => ({
	SidebarMenu: ({ children }: { children: ReactNode }) => createElement('ul', {}, children),
	SidebarMenuItem: ({ children }: { children: ReactNode }) => createElement('li', {}, children),
	SidebarMenuButton: ({ children, isActive }: { children: ReactNode; isActive: boolean }) =>
		createElement('div', { 'data-active': isActive }, children),
}))

describe('StudioSideNavigation', () => {
	it('작업 진입점을 아이콘이 있는 단일 레벨 링크로 표시한다', () => {
		const { container } = render(createElement(StudioSideNavigation))

		expect(screen.getByRole('link', { name: 'Studio' })).toHaveAttribute('href', '/studio')
		expect(screen.getByRole('link', { name: 'Examples' })).toHaveAttribute(
			'href',
			'/studio/examples',
		)
		expect(screen.getByRole('link', { name: 'Template' })).toHaveAttribute(
			'href',
			'/studio/template',
		)
		expect(screen.getByRole('link', { name: 'Image' })).toHaveAttribute(
			'href',
			'/studio/generate/image',
		)
		expect(screen.getByRole('link', { name: 'Graphic' })).toHaveAttribute(
			'href',
			'/studio/generate/graphic',
		)
		expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute(
			'href',
			'/studio/review',
		)
		expect(screen.getByRole('link', { name: 'Template' })).toHaveAttribute(
			'aria-current',
			'page',
		)
		expect(screen.getByRole('link', { name: 'Studio' })).not.toHaveAttribute('aria-current')
		expect(container.querySelectorAll('[data-icon="inline-end"]')).toHaveLength(6)
		expect(screen.getAllByRole('listitem')).toHaveLength(6)
	})
})
