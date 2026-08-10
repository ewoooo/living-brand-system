import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IMAGE_TRANSFORM_DEFAULT, ImageTransformControl } from './image-transform-control'

describe('ImageTransformControl', () => {
	afterEach(cleanup)

	it('화살표 키로 Scale·Rotate를 스텝만큼 조절하고 범위를 벗어나지 않는다', () => {
		const onChange = vi.fn()
		render(<ImageTransformControl value={IMAGE_TRANSFORM_DEFAULT} onChange={onChange} />)

		fireEvent.keyDown(screen.getByRole('slider', { name: 'Scale' }), { key: 'ArrowRight' })
		expect(onChange).toHaveBeenLastCalledWith({ ...IMAGE_TRANSFORM_DEFAULT, scale: 1.05 })

		fireEvent.keyDown(screen.getByRole('slider', { name: 'Rotate' }), { key: 'ArrowLeft' })
		// rotate 0에서 아래로 내리면 최솟값 0에 고정된다.
		expect(onChange).toHaveBeenLastCalledWith({ ...IMAGE_TRANSFORM_DEFAULT, rotate: 0 })
	})

	it('포지션 패드는 화살표 키로 중심 기준 오프셋을 옮긴다', () => {
		const onChange = vi.fn()
		render(<ImageTransformControl value={IMAGE_TRANSFORM_DEFAULT} onChange={onChange} />)

		fireEvent.keyDown(screen.getByRole('slider', { name: '이미지 위치' }), { key: 'ArrowDown' })
		expect(onChange).toHaveBeenLastCalledWith({ ...IMAGE_TRANSFORM_DEFAULT, y: 0.05 })
	})
})
