import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DEFAULT_PREVIEW_SIZE, PreviewSizeControl } from './preview-size-control'

it('프리뷰 크기를 25~100% 범위의 키보드 접근 가능한 값으로 전달한다', () => {
	const onChange = vi.fn()
	render(<PreviewSizeControl value={DEFAULT_PREVIEW_SIZE} onChange={onChange} />)
	const slider = screen.getByRole('slider', { name: '프리뷰 크기' })

	expect(slider).toHaveValue('50')
	expect(slider).toHaveAttribute('min', '25')
	expect(slider).toHaveAttribute('max', '100')
	expect(slider).toHaveAttribute('aria-valuetext', '50%')
	fireEvent.change(slider, { target: { value: '75' } })
	expect(onChange).toHaveBeenCalledWith(75)
})
