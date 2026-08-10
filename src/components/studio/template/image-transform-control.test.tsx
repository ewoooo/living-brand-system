import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	IMAGE_TRANSFORM_DEFAULT,
	ImageTransformControl,
	toImageEditTransform,
} from './image-transform-control'

describe('ImageTransformControl', () => {
	afterEach(cleanup)

	it('화살표 키로 Scale·Rotate를 스텝만큼 조절한다 — 어드민과 같은 범위(0.2~5, ±180)', () => {
		const onChange = vi.fn()
		render(<ImageTransformControl value={IMAGE_TRANSFORM_DEFAULT} onChange={onChange} />)

		fireEvent.keyDown(screen.getByRole('slider', { name: 'Scale' }), { key: 'ArrowRight' })
		expect(onChange).toHaveBeenLastCalledWith({ ...IMAGE_TRANSFORM_DEFAULT, scale: 1.05 })

		fireEvent.keyDown(screen.getByRole('slider', { name: 'Rotate' }), { key: 'ArrowLeft' })
		expect(onChange).toHaveBeenLastCalledWith({ ...IMAGE_TRANSFORM_DEFAULT, rotate: -1 })
	})

	it('포지션 패드는 화살표 키로 중심 기준 오프셋을 옮긴다', () => {
		const onChange = vi.fn()
		render(<ImageTransformControl value={IMAGE_TRANSFORM_DEFAULT} onChange={onChange} />)

		fireEvent.keyDown(screen.getByRole('slider', { name: '이미지 위치' }), { key: 'ArrowDown' })
		expect(onChange).toHaveBeenLastCalledWith({ ...IMAGE_TRANSFORM_DEFAULT, y: 0.05 })
	})

	it('toImageEditTransform은 패드 좌표를 슬롯 절반 단위 px로 환산하고 ±1000에 고정한다', () => {
		expect(toImageEditTransform({ x: 0.5, y: -1, scale: 1.1, rotate: 60 }, 400, 300)).toEqual({
			x: 100,
			y: -150,
			scale: 1.1,
			rotate: 60,
		})
		// 어드민 clampTransform과 같은 상한 — 큰 판형에서도 ±1000px를 넘지 않는다.
		expect(toImageEditTransform({ x: 1, y: 1, scale: 1, rotate: 0 }, 4000, 4000)).toEqual({
			x: 1000,
			y: 1000,
			scale: 1,
			rotate: 0,
		})
	})
})
