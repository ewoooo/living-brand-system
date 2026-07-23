import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NavigationBlock } from './navigation-block'

describe('NavigationBlock', () => {
	it('variant에 맞는 기본 chevron과 설명을 렌더링한다', () => {
		const { container, rerender } = render(
			<NavigationBlock variant="hero" href="/guideline" label="Guideline" />,
		)

		expect(container.querySelector('svg')).not.toBeInTheDocument()

		rerender(
			<NavigationBlock
				variant="section"
				href="/guideline/color"
				label="Color"
				description="브랜드 색상 기준"
			/>,
		)

		expect(screen.getByText('브랜드 색상 기준')).toBeInTheDocument()
		expect(container.querySelector('svg')).toBeInTheDocument()
	})
})
