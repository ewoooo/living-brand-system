import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { GuidelineImage } from './guideline-image'

describe('GuidelineImage', () => {
	it('블록 이미지가 없으면 플레이스홀더를 렌더한다', () => {
		render(createElement(GuidelineImage, { variant: 'block' }))

		expect(screen.getByText('이미지 없음').parentElement).toHaveClass('aspect-video')
	})

	it.each(['section', 'page'] as const)('%s 이미지를 렌더한다', (variant) => {
		render(
			createElement(GuidelineImage, {
				variant,
				image: { url: `/${variant}.png`, alt: variant },
				ratio: variant === 'page' ? '4:3' : undefined,
			}),
		)

		const image = screen.getByRole('img', { name: variant })
		expect(image).toHaveAttribute('src', `/${variant}.png`)
		expect(image.parentElement).toHaveClass(variant === 'page' ? 'aspect-4/3' : 'aspect-video')
	})
})
