import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { GetGuidelineNavigationOutput } from '@/features/guideline/services/get-guideline-navigation.service'
import { GuidelineSideNavigation } from './guideline-side-navigation'

vi.mock('next/navigation', () => ({
	usePathname: () => '/guideline/guidelines/lbs-structure',
}))

vi.mock('./guideline-page-navigation', () => ({
	scrollToGuidelinePage: vi.fn(),
	useActivePageSlug: () => 'japanese',
}))

beforeEach(() => {
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => ({
			addEventListener: vi.fn(),
			matches: false,
			removeEventListener: vi.fn(),
		})),
	)
})

const chapters: GetGuidelineNavigationOutput['chapters'] = [
	{
		id: 1,
		title: 'Guidelines',
		description: null,
		href: '/guideline/guidelines',
		topics: [
			{
				id: 2,
				title: 'LBS Structure',
				href: '/guideline/guidelines/lbs-structure',
				pages: [
					{
						id: 3,
						title: 'Naming definition',
						href: '/guideline/guidelines/lbs-structure#naming-definition',
					},
					{
						id: 4,
						title: 'Japanese',
						href: '/guideline/guidelines/lbs-structure#japanese',
					},
				],
			},
			{
				id: 5,
				title: 'Identity',
				href: '/guideline/guidelines/identity',
				pages: [
					{
						id: 6,
						title: 'Identity details',
						href: '/guideline/guidelines/identity#identity-details',
					},
				],
			},
		],
	},
]

describe('GuidelineSideNavigation', () => {
	it('활성 경로를 chapter → topic → page depth로 표시한다', () => {
		const { container } = render(
			<TooltipProvider>
				<SidebarProvider>
					<GuidelineSideNavigation chapters={chapters} />
				</SidebarProvider>
			</TooltipProvider>,
		)

		expect(screen.getByRole('navigation', { name: '가이드라인 목차' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Guidelines' }).closest('li')).toHaveAttribute(
			'data-depth',
			'0',
		)
		expect(screen.getByRole('link', { name: 'LBS Structure' }).closest('li')).toHaveAttribute(
			'data-depth',
			'1',
		)
		expect(screen.getByRole('link', { name: 'Japanese' })).toHaveAttribute(
			'aria-current',
			'location',
		)
		expect(screen.getByRole('link', { name: 'Japanese' }).closest('li')).toHaveAttribute(
			'data-depth',
			'2',
		)
		expect(screen.queryByRole('link', { name: 'Identity details' })).not.toBeInTheDocument()
		expect(container.querySelector('[data-slot="guideline-side-navigation"]')).toHaveClass(
			'md:w-[265px]',
		)
	})
})
