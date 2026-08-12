import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import {
	forwardStraightGraphicConfig,
	radialFlutedGlassGraphicConfig,
} from '@/features/graphic-generation/domain/graphic-studio-manifest'
import { FORWARD_STRAIGHT_DEFAULT_INPUT } from '@/features/graphic-generation/forward-straight'
import { RADIAL_FLUTED_GLASS_DEFAULT_INPUT } from '@/features/graphic-generation/radial-fluted-glass'
import { GraphicGenerator } from './graphic-generator'

const mocks = vi.hoisted(() => {
	const preview = {
		destroy: vi.fn(),
		getViewport: vi.fn(() => ({ width: 800, height: 600 })),
		resize: vi.fn(),
		update: vi.fn(),
	}
	const shaderPreview = {
		destroy: vi.fn(),
		getViewport: vi.fn(() => ({ width: 800, height: 600 })),
		resize: vi.fn(),
		update: vi.fn(),
	}
	const state = {
		onInputChange: undefined as
			| ((input: typeof FORWARD_STRAIGHT_DEFAULT_INPUT) => boolean)
			| undefined,
		preview,
		createPreview: vi.fn(),
		shaderPreview,
		createShaderPreview: vi.fn(async () => shaderPreview),
	}
	state.createPreview.mockImplementation(
		(options: {
			onInputChange?: (input: typeof FORWARD_STRAIGHT_DEFAULT_INPUT) => boolean
		}) => {
			state.onInputChange = options.onInputChange
			return preview
		},
	)
	return state
})

vi.mock('@/features/graphic-generation/preview.client', () => ({
	createForwardStraightPreview: mocks.createPreview,
}))

vi.mock('@/features/graphic-generation/radial-fluted-glass-preview.client', () => ({
	createRadialFlutedGlassPreview: mocks.createShaderPreview,
}))

beforeEach(() => {
	vi.clearAllMocks()
	mocks.onInputChange = undefined
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

describe('GraphicGenerator', () => {
	it('Shader 계약도 Forward Straight 변환 없이 공용 text·color·range primitive를 그린다', () => {
		const config = {
			studio: 'graphic',
			id: 'shader-demo',
			version: 1,
			name: 'Shader Demo',
			type: 'shader',
			output: { formats: [] },
			controller: {
				groups: [
					{
						id: 'values',
						title: 'Values',
						controls: [
							{
								id: 'caption',
								kind: 'text',
								label: 'Caption',
								defaultValue: '',
								multiline: true,
								maxLength: 20,
							},
							{
								id: 'color',
								kind: 'color',
								label: 'Color',
								defaultValue: null,
							},
							{
								id: 'intensity',
								kind: 'range',
								label: 'Intensity',
								defaultValue: 0.5,
								min: 0,
								max: 1,
								step: 0.1,
							},
						],
					},
				],
			},
		} satisfies GraphicStudioConfig

		render(createElement(GraphicGenerator, { config }))

		expect(screen.getByLabelText('Caption')).toHaveAttribute('maxlength', '20')
		expect(screen.getByLabelText('Color 색상 선택')).toBeInTheDocument()
		expect(screen.getByRole('slider', { name: 'Intensity' })).toHaveAttribute(
			'aria-valuenow',
			'0.5',
		)
		expect(screen.getByRole('alert')).toHaveTextContent('지원하지 않는 그래픽 런타임')
	})

	it('P5 Definition을 Controller primitive로 그리고 변경값을 캔버스에 전달한다', async () => {
		const user = userEvent.setup()
		render(createElement(GraphicGenerator, { config: forwardStraightGraphicConfig }))

		expect(screen.getByRole('radio', { name: 'Off' })).toBeChecked()
		const viewpoint = screen.getByRole('combobox', { name: '시점' })
		expect(viewpoint).toHaveTextContent('평면')
		expect(screen.getByRole('combobox', { name: '각도' })).toHaveTextContent('보통')

		fireEvent.click(screen.getByRole('radio', { name: 'On' }))
		viewpoint.focus()
		await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

		await waitFor(() =>
			expect(mocks.preview.update).toHaveBeenLastCalledWith(
				expect.objectContaining({ variableWeightEnabled: true, viewpoint: 'low-angle' }),
			),
		)
	})

	it('Shader Definition을 WebGL preview와 MP4 Export UI에 연결한다', async () => {
		const { unmount } = render(
			createElement(GraphicGenerator, { config: radialFlutedGlassGraphicConfig }),
		)

		await waitFor(() =>
			expect(mocks.createShaderPreview).toHaveBeenCalledWith(
				expect.objectContaining({ input: RADIAL_FLUTED_GLASS_DEFAULT_INPUT }),
			),
		)
		expect(screen.queryByRole('button', { name: 'SVG 다운로드' })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'MP4 다운로드' })).toBeDisabled()

		fireEvent.keyDown(screen.getByRole('slider', { name: '광선 강도' }), {
			key: 'ArrowRight',
		})
		await waitFor(() =>
			expect(mocks.shaderPreview.update).toHaveBeenLastCalledWith(
				expect.objectContaining({ rayIntensity: 0.83 }),
			),
		)

		unmount()
		expect(mocks.shaderPreview.destroy).toHaveBeenCalledOnce()
	})

	it('등록된 id와 type이 일치하지 않으면 런타임을 실행하지 않는다', () => {
		render(
			createElement(GraphicGenerator, {
				config: { ...forwardStraightGraphicConfig, type: 'shader' },
			}),
		)

		expect(screen.getByRole('alert')).toHaveTextContent('지원하지 않는 그래픽 런타임')
		expect(mocks.createPreview).not.toHaveBeenCalled()
	})

	it('런타임이 명시한 origin Pad에만 캔버스 비율을 연결한다', async () => {
		const config = {
			...forwardStraightGraphicConfig,
			controller: {
				groups: forwardStraightGraphicConfig.controller.groups.map((group) =>
					group.id === 'position'
						? {
								...group,
								controls: [
									...group.controls,
									{
										id: 'offset',
										kind: 'pad' as const,
										label: 'Offset',
										defaultValue: { x: 0, y: 0 },
									},
								],
							}
						: group,
				),
			},
		} satisfies GraphicStudioConfig

		render(createElement(GraphicGenerator, { config }))
		await waitFor(() =>
			expect(screen.getByRole('slider', { name: '기준점' })).toHaveStyle({
				aspectRatio: '1.3333333333333333',
			}),
		)
		expect(screen.getByRole('slider', { name: 'Offset' }).style.aspectRatio).toBe('')
	})

	it('readonly control은 캔버스 직접 조작으로도 변경하지 않는다', async () => {
		const config = {
			...forwardStraightGraphicConfig,
			controller: {
				groups: forwardStraightGraphicConfig.controller.groups.map((group) =>
					group.id === 'position'
						? {
								...group,
								controls: group.controls.map((control) => ({
									...control,
									availability: 'readonly' as const,
								})),
							}
						: group,
				),
			},
		} satisfies GraphicStudioConfig

		render(createElement(GraphicGenerator, { config }))
		await waitFor(() => expect(mocks.createPreview).toHaveBeenCalledOnce())
		expect(
			mocks.onInputChange?.({
				...FORWARD_STRAIGHT_DEFAULT_INPUT,
				origin: { x: 0.6, y: 0.4 },
			}),
		).toBe(false)

		await Promise.resolve()
		expect(mocks.preview.update).not.toHaveBeenCalled()
	})

	it('캔버스의 입력 변경을 같은 Context를 통해 Pad에 되돌린다', async () => {
		render(createElement(GraphicGenerator, { config: forwardStraightGraphicConfig }))
		await waitFor(() => expect(mocks.createPreview).toHaveBeenCalledOnce())

		mocks.onInputChange?.({
			...FORWARD_STRAIGHT_DEFAULT_INPUT,
			origin: { x: 0.6, y: 0.4 },
		})

		await waitFor(() =>
			expect(screen.getByRole('slider', { name: '기준점' })).toHaveAttribute(
				'aria-valuenow',
				'20',
			),
		)
	})

	it('현재 Controller 값과 화면 크기로 SVG를 다운로드한다', async () => {
		const createObjectURL = vi.fn((_blob: Blob) => 'blob:forward-straight')
		const revokeObjectURL = vi.fn()
		Object.defineProperties(URL, {
			createObjectURL: { configurable: true, value: createObjectURL },
			revokeObjectURL: { configurable: true, value: revokeObjectURL },
		})
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

		const { unmount } = render(
			createElement(GraphicGenerator, { config: forwardStraightGraphicConfig }),
		)

		await waitFor(() => expect(mocks.createPreview).toHaveBeenCalledOnce())
		fireEvent.keyDown(screen.getByRole('slider', { name: '기준점' }), { key: 'ArrowRight' })
		await waitFor(() =>
			expect(mocks.preview.update).toHaveBeenLastCalledWith(
				expect.objectContaining({ origin: { x: 0.525, y: 0.5 } }),
			),
		)
		fireEvent.click(screen.getByRole('button', { name: 'SVG 다운로드' }))
		await waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce())

		const blob = createObjectURL.mock.calls[0]?.[0] as Blob
		expect(blob).toMatchObject({ type: 'image/svg+xml' })
		const svg = await new Promise<string>((resolve) => {
			const reader = new FileReader()
			reader.onload = () => resolve(String(reader.result))
			reader.readAsText(blob)
		})
		expect(svg).toContain('width="800" height="600"')
		expect(svg).toContain('cx="420.00" cy="300.00"')
		expect(click.mock.instances[0]).toMatchObject({
			download: 'forward-straight.svg',
			href: 'blob:forward-straight',
		})
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:forward-straight')

		unmount()
		expect(mocks.preview.destroy).toHaveBeenCalledOnce()
	})
})
