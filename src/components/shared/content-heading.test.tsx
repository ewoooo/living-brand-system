import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContentHeading } from './content-heading'

describe('ContentHeading', () => {
	it('문서 계층과 설명을 전달받은 수준으로 렌더링한다', () => {
		render(<ContentHeading level={2} title="Images" description="이미지 제작 도구" />)

		expect(screen.getByRole('heading', { level: 2, name: 'Images' })).toBeInTheDocument()
		expect(screen.getByText('이미지 제작 도구')).toBeInTheDocument()
	})
})
