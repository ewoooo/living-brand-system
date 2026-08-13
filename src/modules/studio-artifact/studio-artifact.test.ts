// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { withCanvasRasterSource } from './studio-artifact'

describe('withCanvasRasterSource', () => {
	it('임시 렌더 읽기가 실패해도 원래 상태를 복원한다', () => {
		const render = vi.fn()
		const restore = vi.fn()
		const source = { canvas: document.createElement('canvas'), render, restore }

		expect(() =>
			withCanvasRasterSource(source, 1200, 800, () => {
				throw new Error('read failed')
			}),
		).toThrow('read failed')
		expect(render).toHaveBeenCalledWith(1200, 800)
		expect(restore).toHaveBeenCalledOnce()
	})
})
