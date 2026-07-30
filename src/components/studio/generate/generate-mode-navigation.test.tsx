import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { GenerateModeNavigation } from './generate-mode-navigation'

vi.mock('next/navigation', () => ({
	usePathname: () => '/studio/generate/graphic',
}))

describe('GenerateModeNavigation', () => {
	it('이미지와 그래픽 페이지를 연결하고 현재 페이지를 표시한다', () => {
		render(createElement(GenerateModeNavigation))

		expect(screen.getByRole('link', { name: '이미지 생성' })).toHaveAttribute(
			'href',
			'/studio/generate',
		)
		expect(screen.getByRole('link', { name: '그래픽 생성' })).toHaveAttribute(
			'href',
			'/studio/generate/graphic',
		)
		expect(screen.getByRole('link', { name: '그래픽 생성' })).toHaveAttribute(
			'aria-current',
			'page',
		)
	})
})
