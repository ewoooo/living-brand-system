import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import {
	DEFAULT_PREVIEW_SIZE,
	PreviewSizeControl,
	StudioCanvasFooter,
} from './preview-size-control'

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

it('떠 있는 자리는 바가 갖고 컨트롤은 자기 폭만 갖는다', () => {
	const { container } = render(
		<StudioCanvasFooter>
			<PreviewSizeControl value={DEFAULT_PREVIEW_SIZE} onChange={vi.fn()} />
		</StudioCanvasFooter>,
	)

	const footer = container.querySelector('[data-slot="studio-canvas-footer"]')
	expect(footer).toHaveClass('absolute', 'bottom-10', 'left-1/2', 'shadow-lg')
	// 컨트롤이 자리를 다시 잡으면 바 안에서 겹친다.
	const control = container.querySelector('[data-slot="preview-size-control"]')
	expect(control).not.toHaveClass('absolute')
	expect(control).toHaveClass('w-[233px]')
})
