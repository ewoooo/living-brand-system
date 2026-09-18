import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { CorporateIdentityReference } from './corporate-identity'

afterEach(cleanup)
it('목표 페이지가 새 구조와 보호공간 토글을 사용한다', () => {
	const { container } = render(<CorporateIdentityReference />)
	expect(screen.getByRole('heading', { level: 1, name: 'Corporate Identity' })).toBeTruthy()
	expect(screen.getByRole('heading', { level: 3, name: 'Safe Area' })).toBeTruthy()
	expect(container.querySelector('[data-slot="reference-card"]')).toBeNull()
	expect(container.querySelector('[data-slot="clearspace-overlay"]')).toBeNull()
	fireEvent.click(screen.getByRole('radio', { name: 'On' }))
	expect(
		container.querySelector('[data-slot="clearspace-overlay"]')?.getAttribute('src'),
	).toContain('hd-horizontal-default-clearSpace.svg')
	expect(screen.getByRole('button', { name: 'Brand Signature 에셋 전체 다운로드' })).toBeTruthy()
	expect(screen.getByRole('button', { name: 'Safe Area 에셋 전체 다운로드' })).toBeTruthy()
})
