import type { CarbonIconType } from '@carbon/icons-react'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { StudioSideNavigation } from './studio-side-navigation'

type SidebarItemMockProps = {
	current?: boolean
	href: string
	icon: CarbonIconType
	label: string
}

vi.mock('next/navigation', () => ({
	usePathname: () => '/studio/template/cards/2',
}))

vi.mock('@/components/global/sidebar/sidebar', () => ({
	Sidebar: {
		Group: ({ children }: { children: ReactNode }) => createElement('ul', {}, children),
		Item: ({ current, href, icon: Icon, label }: SidebarItemMockProps) =>
			createElement(
				'li',
				{},
				createElement(
					'a',
					{ 'aria-current': current ? 'page' : undefined, href },
					label,
					createElement(
						'span',
						{ 'data-icon': 'inline-end' },
						createElement(Icon, { 'aria-hidden': true }),
					),
				),
			),
		Root: ({ children, ...props }: { children: ReactNode; 'data-slot'?: string }) =>
			createElement('aside', props, children),
		Separator: () => createElement('div', { 'data-slot': 'sidebar-separator' }),
		Trigger: () =>
			createElement('button', { 'aria-label': '사이드바 접기 또는 펼치기', type: 'button' }),
	},
}))

vi.mock('@/components/ui/sidebar', () => ({
	useSidebar: () => ({ state: 'expanded' }),
}))

describe('StudioSideNavigation', () => {
	it('작업 진입점을 아이콘이 있는 단일 레벨 링크로 표시한다', () => {
		const { container } = render(createElement(StudioSideNavigation))

		expect(container.querySelector('[data-slot="studio-side-navigation"]')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/studio')
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
		expect(screen.getByRole('link', { name: 'MCP' })).toHaveAttribute('href', '/studio/mcp')
		expect(screen.getByRole('link', { name: 'Template' })).toHaveAttribute(
			'aria-current',
			'page',
		)
		expect(screen.getByRole('link', { name: 'Get Started' })).not.toHaveAttribute(
			'aria-current',
		)
		expect(container.querySelectorAll('[data-icon="inline-end"]')).toHaveLength(6)
		expect(container.querySelectorAll('[data-slot="sidebar-separator"]')).toHaveLength(2)
		expect(
			screen.getByRole('button', { name: '사이드바 접기 또는 펼치기' }),
		).toBeInTheDocument()
		expect(screen.getAllByRole('listitem')).toHaveLength(6)
	})
})
