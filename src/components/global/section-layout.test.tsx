import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SectionLayout } from './section-layout'

afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
})

describe('SectionLayout', () => {
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

	it('workspace는 데스크톱 외부 스크롤과 전역 footer를 제거한다', () => {
		const { container } = render(
			<SectionLayout nav={<nav />} mobileNavigation={false} variant="workspace">
				<div>Studio</div>
			</SectionLayout>,
		)

		expect(container.querySelector('[data-slot="sidebar-wrapper"]')).toHaveClass(
			'pt-[50px]',
			'xl:pt-(--global-header-height)',
		)
		expect(container.querySelector('[data-slot="section-scroll-container"]')).toHaveClass(
			'lg:overflow-hidden',
		)
		expect(container.querySelector('[data-slot="global-footer"]')).not.toBeInTheDocument()
	})
})
