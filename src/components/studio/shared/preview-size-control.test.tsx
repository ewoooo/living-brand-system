import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ControllerBar } from '@/components/shared/controller'
import { DEFAULT_PREVIEW_SIZE, PreviewSizeControl } from './preview-size-control'

it('프리뷰 크기를 25~100% 범위의 키보드 접근 가능한 값으로 전달한다', () => {
	const onChange = vi.fn()
	render(<PreviewSizeControl value={DEFAULT_PREVIEW_SIZE} onChange={onChange} />)
	const slider = screen.getByRole('slider', { name: 'Preview Size' })

	expect(slider).toHaveAttribute('aria-valuenow', '50')
	expect(slider).toHaveAttribute('aria-valuemin', '25')
	expect(slider).toHaveAttribute('aria-valuemax', '100')
	expect(slider).toHaveAttribute('aria-valuetext', '50%')

	fireEvent.keyDown(slider, { key: 'ArrowRight' })
	expect(onChange).toHaveBeenCalledWith(55)
	fireEvent.keyDown(slider, { key: 'ArrowLeft' })
	expect(onChange).toHaveBeenCalledWith(45)
})

it('트랙은 킷의 Value Range 프리미티브가 그린다', () => {
	const { container } = render(
		<PreviewSizeControl value={DEFAULT_PREVIEW_SIZE} onChange={vi.fn()} />,
	)

	// 자체 트랙을 다시 만들면 킷의 접근성·모션이 갈라진다(docs/10 §3.6).
	expect(container.querySelector('[data-slot="controller-range"]')).toBeInTheDocument()
	expect(container.querySelector('input[type="range"]')).toBeNull()
})

it('떠 있는 자리는 바가 갖고 컨트롤은 자기 폭만 갖는다', () => {
	const { container } = render(
		<ControllerBar placement="canvas">
			<PreviewSizeControl value={DEFAULT_PREVIEW_SIZE} onChange={vi.fn()} />
		</ControllerBar>,
	)

	const footer = container.querySelector('[data-slot="controller-bar"]')
	expect(footer).toHaveClass('absolute', 'bottom-10', 'left-1/2', 'shadow-lg')
	// 컨트롤이 자리를 다시 잡으면 바 안에서 겹친다.
	const control = container.querySelector('[data-slot="controller-range"]')
	expect(control).not.toHaveClass('absolute')
	expect(control).toHaveClass('w-48')
})
