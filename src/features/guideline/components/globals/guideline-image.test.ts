import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { GuidelineImage } from './guideline-image'

describe('GuidelineImage', () => {
	it('블록 이미지가 없으면 플레이스홀더를 렌더한다', () => {
		render(createElement(GuidelineImage, { variant: 'block' }))

		expect(screen.getByText('이미지 없음').parentElement).toHaveClass('aspect-video')
	})

	it.each(['topic', 'section'] as const)('%s 이미지를 렌더한다', (variant) => {
		render(
			createElement(GuidelineImage, {
				variant,
				image: { url: `/${variant}.png`, alt: variant },
				ratio: variant === 'section' ? '4:3' : undefined,
			}),
		)

		const image = screen.getByRole('img', { name: variant })
		expect(image).toHaveAttribute('src', `/${variant}.png`)
		expect(image.parentElement).toHaveClass(
			variant === 'section' ? 'aspect-4/3' : 'aspect-video',
		)
	})

	it('원본 비율은 고정 비율을 적용하지 않고 빈 이미지에는 기본 비율을 유지한다', () => {
		const { container, rerender } = render(
			createElement(GuidelineImage, {
				variant: 'block',
				image: { url: '/original.png', alt: '원본' },
				ratio: 'original',
			}),
		)

		expect(screen.getByRole('img', { name: '원본' }).parentElement?.className).not.toContain(
			'aspect-',
		)

		rerender(createElement(GuidelineImage, { variant: 'block', ratio: 'original' }))

		expect(container.firstElementChild).toHaveClass('aspect-video')
	})
})
