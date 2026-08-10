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

	it('포인터 다운이 정규 좌표로 환산되고, 좌클릭만 드래그를 시작한다', () => {
		const onChange = vi.fn()
		render(<ImageTransformControl value={IMAGE_TRANSFORM_DEFAULT} onChange={onChange} />)
		const pad = screen.getByRole('slider', { name: '이미지 위치' })
		vi.spyOn(pad, 'getBoundingClientRect').mockReturnValue({
			left: 0,
			top: 0,
			width: 100,
			height: 100,
			right: 100,
			bottom: 100,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		} as DOMRect)

		// 우클릭은 무시 — 컨텍스트 메뉴로 빠지면 pointerup이 안 와 드래그가 낀다.
		fireEvent.pointerDown(pad, { clientX: 75, clientY: 50, button: 2 })
		expect(onChange).not.toHaveBeenCalled()

		// 좌클릭 (75, 50) → 가로 0.5, 세로 0 (중심 기준).
		fireEvent.pointerDown(pad, { clientX: 75, clientY: 50, button: 0 })
		expect(onChange).toHaveBeenLastCalledWith({ ...IMAGE_TRANSFORM_DEFAULT, x: 0.5, y: 0 })

		// 경계 밖 포인터는 -1~1로 clamp된다.
		fireEvent.pointerMove(pad, { clientX: 500, clientY: -50 })
		expect(onChange).toHaveBeenLastCalledWith({ ...IMAGE_TRANSFORM_DEFAULT, x: 1, y: -1 })
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
