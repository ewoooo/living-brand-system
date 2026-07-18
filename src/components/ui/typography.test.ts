import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { Typography } from './typography'

describe('Typography', () => {
	it('의미 태그와 타이포그래피 속성을 함께 적용한다', () => {
		render(
			createElement(
				Typography,
				{
					as: 'h2',
					className: 'mt-4',
					family: 'title',
					size: '2xl',
					tone: 'muted',
					weight: 'semibold',
				},
				'섹션 제목',
			),
		)

		expect(screen.getByRole('heading', { level: 2, name: '섹션 제목' })).toHaveClass(
			'font-title',
			'text-2xl',
			'font-semibold',
			'text-muted-foreground',
			'mt-4',
		)
	})
})
