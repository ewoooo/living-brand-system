import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { NavigationBlock } from './navigation-block'

afterEach(cleanup)

describe('NavigationBlock', () => {
	it.each([
		['xl', '6xl', 'p-6'],
		['lg', '4xl', 'p-6'],
		['md', '2xl', 'p-4'],
		['sm', 'lg', 'p-3'],
	] as const)('%s variant의 크기 체계를 적용한다', (variant, textSize, padding) => {
		const { container } = render(
			<NavigationBlock variant={variant} href="/guideline" label="Guideline" />,
		)

		expect(container.querySelector('[data-slot="navigation-block"]')).toHaveClass(padding)
		expect(container.querySelector('[data-slot="typography"]')).toHaveAttribute(
			'data-size',
			textSize,
		)
	})

	it('설명과 전달받은 tail을 렌더링한다', () => {
		render(
			<NavigationBlock
				variant="md"
				href="/guideline/color"
				label="Color"
				description="브랜드 색상 기준"
				tail={<span>Tail</span>}
			/>,
		)

		expect(screen.getByText('브랜드 색상 기준')).toBeInTheDocument()
		expect(screen.getByText('Tail')).toBeInTheDocument()
	})

	it('부모가 전달한 layout class를 루트에 적용한다', () => {
		const { container } = render(
			<NavigationBlock
				variant="xl"
				href="/guideline"
				label="Guideline"
				className="aspect-square"
			/>,
		)

		expect(container.querySelector('[data-slot="navigation-block"]')).toHaveClass(
			'h-full',
			'aspect-square',
		)
		expect(container.querySelector('[data-slot="typography"]')).toHaveAttribute(
			'data-size',
			'6xl',
		)
		expect(container.querySelector('[data-slot="typography"]')).not.toHaveClass('aspect-square')
	})
})
