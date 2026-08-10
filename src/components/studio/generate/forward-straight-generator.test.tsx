import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ForwardStraightGenerator } from './forward-straight-generator'

const mocks = vi.hoisted(() => {
	const preview = {
		destroy: vi.fn(),
		getViewport: vi.fn(() => ({ width: 800, height: 600 })),
		resize: vi.fn(),
		update: vi.fn(),
	}
	return {
		createPreview: vi.fn(() => preview),
		preview,
	}
})

vi.mock('@/features/generate-graphic/forward-straight-preview.client', () => ({
	createForwardStraightPreview: mocks.createPreview,
}))

beforeEach(() => {
	vi.clearAllMocks()
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect() {}
		},
	)
})

afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
})

describe('ForwardStraightGenerator', () => {
	it('도구 계약의 컨트롤과 기본값을 렌더링하고 변경한다', async () => {
		const user = userEvent.setup()
		render(createElement(ForwardStraightGenerator))

		const variableWeight = screen.getByRole('checkbox', { name: '가변 두께' })
		expect(variableWeight).not.toBeChecked()
		const viewpoint = screen.getByRole('combobox', { name: '시점' })
		expect(viewpoint).toHaveTextContent('평면')
		expect(screen.getByRole('combobox', { name: '각도' })).toHaveTextContent('보통')

		fireEvent.click(variableWeight)
		viewpoint.focus()
		await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

		expect(variableWeight).toBeChecked()
		expect(viewpoint).toHaveTextContent('로우앵글')
	})

	it('미리보기를 연결하고 현재 입력과 화면 크기로 SVG를 다운로드한다', async () => {
		const createObjectURL = vi.fn((_blob: Blob) => 'blob:forward-straight')
		const revokeObjectURL = vi.fn()
		Object.defineProperties(URL, {
			createObjectURL: { configurable: true, value: createObjectURL },
			revokeObjectURL: { configurable: true, value: revokeObjectURL },
		})
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

		const { unmount } = render(createElement(ForwardStraightGenerator))

		await waitFor(() => expect(mocks.createPreview).toHaveBeenCalledOnce())
		fireEvent.change(screen.getByLabelText('기준점 X'), {
			target: { value: '0.51' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'SVG 다운로드' }))

		const blob = createObjectURL.mock.calls[0]?.[0] as Blob
		expect(blob).toMatchObject({ type: 'image/svg+xml' })
		// jsdom Blob에는 text()가 없어 FileReader로 내용을 읽는다.
		const svg = await new Promise<string>((resolve) => {
			const reader = new FileReader()
			reader.onload = () => resolve(String(reader.result))
			reader.readAsText(blob)
		})
		// getViewport 800x600과 기준점 X 0.51(=408px)이 SVG에 반영된다.
		expect(svg).toContain('width="800" height="600"')
		expect(svg).toContain('cx="408.00" cy="300.00"')
		expect(click.mock.instances[0]).toMatchObject({
			download: 'forward-straight.svg',
			href: 'blob:forward-straight',
		})
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:forward-straight')

		unmount()
		expect(mocks.preview.destroy).toHaveBeenCalledOnce()
	})
})
