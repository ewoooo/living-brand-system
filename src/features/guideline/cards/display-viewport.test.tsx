import { act, cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { DisplayViewport } from './display-viewport'

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

it('도판을 판 안으로 축소하고 크기가 바뀌면 다시 맞추되 확대하지 않는다', () => {
	let resize = () => {}
	let contentHeight = 600
	let childWidth = 400
	const disconnect = vi.fn()
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: () => void) {
				resize = callback
			}
			observe() {}
			disconnect = disconnect
		},
	)
	vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
	vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300)
	vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
		this: HTMLElement,
	) {
		return this.tagName === 'P' ? childWidth : 400
	})
	vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => contentHeight)
	const { container, unmount } = render(
		<DisplayViewport>
			<p>도판</p>
		</DisplayViewport>,
	)
	const content = container.querySelector('[data-slot="card-display"] > div')
	expect(content).toHaveStyle({ transform: 'translate(-50%, -50%) scale(0.5)' })
	act(() => {
		contentHeight = 100
		resize()
	})
	expect(content).toHaveStyle({ transform: 'translate(-50%, -50%) scale(1)' })
	act(() => {
		childWidth = 800
		resize()
	})
	expect(content).toHaveStyle({ transform: 'translate(-50%, -50%) scale(0.5)' })
	unmount()
	expect(disconnect).toHaveBeenCalledOnce()
})
