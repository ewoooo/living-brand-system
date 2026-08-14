import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { StudioSideNavigation } from './studio-side-navigation'

vi.mock('next/navigation', () => ({
	usePathname: () => '/studio/template/second-template',
}))

vi.mock('@/components/ui/sidebar', () => ({
	Sidebar: ({ children }: { children: ReactNode }) => createElement('div', {}, children),
	SidebarContent: ({ children }: { children: ReactNode }) => createElement('div', {}, children),
	SidebarMenu: ({ children }: { children: ReactNode }) => createElement('ul', {}, children),
	SidebarMenuItem: ({ children }: { children: ReactNode }) => createElement('li', {}, children),
	SidebarMenuSub: ({ children }: { children: ReactNode }) => createElement('ul', {}, children),
	SidebarMenuButton: ({ children, isActive }: { children: ReactNode; isActive: boolean }) =>
		createElement('div', { 'data-active': isActive }, children),
	useSidebar: () => ({ isMobile: false }),
}))

describe('StudioSideNavigation', () => {
	it('작업 진입점을 아이콘이 있는 단일 레벨 링크로 표시한다', () => {
		const { container } = render(createElement(StudioSideNavigation))

		expect(screen.getByRole('link', { name: 'Template' })).toHaveAttribute(
			'href',
			'/studio/template',
		)
		expect(screen.getByRole('link', { name: 'Image' })).toHaveAttribute('href', '/studio/image')
		expect(screen.getByRole('link', { name: 'Graphic' })).toHaveAttribute(
			'href',
			'/studio/graphic',
		)
		expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute(
			'href',
			'/studio/review',
		)
		expect(screen.getByRole('link', { name: 'MCP' })).toHaveAttribute('href', '/studio/mcp')
		expect(screen.getByRole('link', { name: 'Assets' })).toHaveAttribute(
			'href',
			'/studio/assets',
		)
		expect(screen.getByRole('link', { name: 'Template' })).toHaveAttribute(
			'aria-current',
			'page',
		)
		expect(container.querySelectorAll('[data-icon="inline-end"]')).toHaveLength(6)
		expect(screen.getAllByRole('listitem')).toHaveLength(6)
	})
})
