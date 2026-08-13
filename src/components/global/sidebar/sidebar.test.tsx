import { Home } from '@carbon/icons-react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from './sidebar'

beforeEach(() => {
	localStorage.clear()
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => ({
			addEventListener: vi.fn(),
			matches: false,
			removeEventListener: vi.fn(),
		})),
	)
})

function StatefulSidebar() {
	const { state } = useSidebar()

	return (
		<Sidebar.Root aria-label="상태 메뉴" collapsed={state === 'collapsed'}>
			<Sidebar.Trigger />
		</Sidebar.Root>
	)
}

describe('Sidebar', () => {
	it('current와 muted를 분리하고 collapsed 상태에서도 링크 이름을 유지한다', () => {
		const { container } = render(
			<TooltipProvider>
				<SidebarProvider>
					<Sidebar.Root aria-label="테스트 메뉴" collapsed>
						<Sidebar.Group>
							<Sidebar.Item
								badge="N"
								current
								href="/current"
								icon={Home}
								label="Current"
								tone="muted"
							/>
						</Sidebar.Group>
						<Sidebar.Separator />
					</Sidebar.Root>
				</SidebarProvider>
			</TooltipProvider>,
		)

		expect(screen.getByRole('navigation', { name: '테스트 메뉴' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'CurrentN' })).toHaveAttribute(
			'aria-current',
			'page',
		)
		expect(container.querySelector('[data-slot="sidebar-root"]')).toHaveAttribute(
			'data-collapsed',
			'true',
		)
		expect(container.querySelector('[data-slot="sidebar-item"]')).toHaveAttribute(
			'data-tone',
			'muted',
		)
		expect(container.querySelector('[data-slot="sidebar-separator"]')).toBeInTheDocument()
	})

	it('trigger로 접은 데스크톱 선택을 브라우저에 저장하고 복원한다', async () => {
		const user = userEvent.setup()
		const renderSidebar = () =>
			render(
				<SidebarProvider storageKey="test.sidebar.open">
					<StatefulSidebar />
				</SidebarProvider>,
			)
		const firstRender = renderSidebar()

		expect(firstRender.container.querySelector('[data-slot="sidebar-root"]')).toHaveAttribute(
			'data-collapsed',
			'false',
		)
		await user.click(screen.getByRole('button', { name: '사이드바 접기 또는 펼치기' }))
		expect(firstRender.container.querySelector('[data-slot="sidebar-root"]')).toHaveAttribute(
			'data-collapsed',
			'true',
		)
		expect(localStorage.getItem('test.sidebar.open')).toBe('false')

		firstRender.unmount()
		const restoredRender = renderSidebar()
		await waitFor(() =>
			expect(
				restoredRender.container.querySelector('[data-slot="sidebar-root"]'),
			).toHaveAttribute('data-collapsed', 'true'),
		)
	})
})
