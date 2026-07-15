import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CheckSideNavigation } from '@/features/asset-check/components/check-side-navigation'
import { getGuidelineSectionPages } from '@/features/guideline/components/globals/guideline-side-navigation'

vi.mock('@/components/global/side-nav/side-nav', () => ({
	SideNav: ({ children }: { children: ReactNode }) => createElement('nav', null, children),
	SideNavGroup: ({ children }: { children: ReactNode }) => createElement('div', null, children),
	SideNavItem: ({ label, href }: { label: string; href: string }) =>
		createElement('a', { href }, label),
}))

describe('side navigation domain composition', () => {
	it('folds guideline sections with one same-title page', () => {
		expect(
			getGuidelineSectionPages({
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

	it('lists published check scenarios', () => {
		render(
			createElement(CheckSideNavigation, {
				scenarios: [
					{ key: 'quick', title: '빠른 기본 검수', checkKeys: ['color.palette'] },
					{ key: 'sns', title: 'SNS 콘텐츠 검수', checkKeys: ['messaging.sns.copy'] },
				],
			}),
		)

		expect(screen.getByRole('link', { name: '빠른 기본 검수' })).toHaveAttribute(
			'href',
			'/review/rules#quick',
		)
		expect(screen.getByRole('link', { name: 'SNS 콘텐츠 검수' })).toHaveAttribute(
			'href',
			'/review/rules#sns',
		)
	})
})
