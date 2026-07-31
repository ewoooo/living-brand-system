import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
		exportSvg: vi.fn(),
		preview,
	}
})

vi.mock('@/features/generate-graphic/forward-straight-preview.client', () => ({
	createForwardStraightPreview: mocks.createPreview,
}))
vi.mock('@/features/generate-graphic/export-forward-straight-svg.client', () => ({
	exportForwardStraightSvg: mocks.exportSvg,
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
	it('도구 계약의 컨트롤과 기본값을 렌더링하고 변경한다', () => {
		render(createElement(ForwardStraightGenerator))

		const variableWeight = screen.getByRole('checkbox', { name: '가변 두께' })
		expect(variableWeight).not.toBeChecked()
		expect(screen.getByLabelText('시점')).toHaveValue('flat')
		expect(screen.getByLabelText('각도')).toHaveValue('medium')

		fireEvent.click(variableWeight)
		fireEvent.change(screen.getByLabelText('시점'), {
			target: { value: 'low-angle' },
		})

		expect(variableWeight).toBeChecked()
		expect(screen.getByLabelText('시점')).toHaveValue('low-angle')
	})

	it('미리보기를 연결하고 현재 입력과 화면 크기로 SVG를 다운로드한다', async () => {
		const { unmount } = render(createElement(ForwardStraightGenerator))

		await waitFor(() => expect(mocks.createPreview).toHaveBeenCalledOnce())
		fireEvent.change(screen.getByLabelText('기준점 X'), {
			target: { value: '0.51' },
		})
		fireEvent.click(screen.getByRole('button', { name: 'SVG 다운로드' }))

		expect(mocks.exportSvg).toHaveBeenCalledWith({
			fileName: 'forward-straight',
			input: expect.objectContaining({ origin: { x: 0.51, y: 0.5 } }),
			viewport: { width: 800, height: 600 },
		})

		unmount()
		expect(mocks.preview.destroy).toHaveBeenCalledOnce()
	})
})
