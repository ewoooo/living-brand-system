import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import { resolveGraphicStudioOutput } from '@/features/graphic-generation/domain/graphic-studio-manifest'
import forwardStraightRuntimeManifest, {
	FORWARD_STRAIGHT_DEFAULT_INPUT,
} from '@/features/graphic-generation/graphic-runtimes/forward-straight/definition'
import { createForwardStraightScene } from '@/features/graphic-generation/graphic-runtimes/forward-straight/model'
import radialFlutedGlassRuntimeManifest, {
	RADIAL_FLUTED_GLASS_DEFAULT_INPUT,
} from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/definition'
import type { ControllerValues } from '@/modules/studio-controller/controller-definition'
import { GraphicGenerator } from './graphic-generator'

const browseMocks = vi.hoisted(() => ({
	fetchGraphicStudioConfigs: vi.fn(async () => [] as unknown[]),
}))
vi.mock(
	'@/features/graphic-generation/services/list-graphic-studio-configs.client',
	() => browseMocks,
)

const forwardStraightConfig = {
	...forwardStraightRuntimeManifest,
	output: resolveGraphicStudioOutput(forwardStraightRuntimeManifest),
} satisfies GraphicStudioConfig

const radialFlutedGlassConfig = {
	...radialFlutedGlassRuntimeManifest,
	output: resolveGraphicStudioOutput(radialFlutedGlassRuntimeManifest),
} satisfies GraphicStudioConfig

const mocks = vi.hoisted(() => {
	const raster = {
		kind: 'raster' as const,
		source: {
			canvas: {} as HTMLCanvasElement,
			render: vi.fn(),
			restore: vi.fn(),
		},
	}
	const preview = {
		artifacts: { raster },
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
		artifacts: {
			raster,
			video: {
				kind: 'video' as const,
				source: {
					canvas: {} as HTMLCanvasElement,
					renderFrame: vi.fn(),
					restore: vi.fn(),
				},
			},
		},
	}
	const canvasFramesToMp4 = vi.fn(async () => new Blob(['mp4'], { type: 'video/mp4' }))
	const state = {
		onInputChange: undefined as
			| ((input: typeof FORWARD_STRAIGHT_DEFAULT_INPUT) => boolean)
			| undefined,
		preview,
		createPreview: vi.fn(),
		shaderPreview,
		createShaderPreview: vi.fn(
			async (_options: { container: HTMLElement; input: ControllerValues }) => shaderPreview,
		),
		canvasFramesToMp4,
		resizeObserverCallback: undefined as ResizeObserverCallback | undefined,
		resizeObserverCount: 0,
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

vi.mock('@/features/graphic-generation/graphic-runtimes/forward-straight/runtime.client', () => ({
	createForwardStraightRuntime: mocks.createPreview,
	default: {
		type: 'p5',
		async mount({
			values,
			onChange,
		}: {
			values: ControllerValues
			onChange: (controlId: string, value: unknown) => boolean
		}) {
			const origin = values.origin as { x: number; y: number }
			const preview = mocks.createPreview({
				input: { ...values, origin: { x: (origin.x + 1) / 2, y: (origin.y + 1) / 2 } },
				onInputChange: (next: typeof FORWARD_STRAIGHT_DEFAULT_INPUT) =>
					onChange('origin', {
						x: next.origin.x * 2 - 1,
						y: next.origin.y * 2 - 1,
					}),
			})
			return {
				...preview,
				update(next: ControllerValues) {
					const nextOrigin = next.origin as { x: number; y: number }
					preview.update({
						...next,
						origin: { x: (nextOrigin.x + 1) / 2, y: (nextOrigin.y + 1) / 2 },
					})
				},
			}
		},
	},
}))

vi.mock(
	'@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/runtime.client',
	() => ({
		createRadialFlutedGlassRuntime: mocks.createShaderPreview,
		default: {
			type: 'shader',
			mount: ({ container, values }: { container: HTMLElement; values: ControllerValues }) =>
				mocks.createShaderPreview({ container, input: values }),
		},
	}),
)

vi.mock('@/features/studio-export/adapters/canvas-frames-to-mp4.mediabunny.client', () => ({
	canvasFramesToMp4: mocks.canvasFramesToMp4,
}))

beforeEach(() => {
	vi.clearAllMocks()
	mocks.onInputChange = undefined
	mocks.resizeObserverCallback = undefined
	mocks.resizeObserverCount = 0
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: ResizeObserverCallback) {
				mocks.resizeObserverCallback = callback
				mocks.resizeObserverCount += 1
			}
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
	it('Shader 계약도 Forward Straight 변환 없이 공용 text·color·range primitive를 그린다', async () => {
		const config = {
			studio: 'graphic',
			id: 'shader-demo',
			version: 1,
			name: 'Shader Demo',
			type: 'shader',
			artifacts: { raster: {} },
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

		render(createElement(GraphicGenerator, { config: config }))

		expect(screen.getByLabelText('Caption')).toHaveAttribute('maxlength', '20')
		expect(screen.getByLabelText('Color 색상 선택')).toBeInTheDocument()
		expect(screen.getByRole('slider', { name: 'Intensity' })).toHaveAttribute(
			'aria-valuenow',
			'0.5',
		)
		expect(await screen.findByRole('alert')).toHaveTextContent('지원하지 않는 그래픽 런타임')
	})

	it('P5 Definition을 Controller primitive로 그리고 변경값을 캔버스에 전달한다', async () => {
		const user = userEvent.setup()
		render(createElement(GraphicGenerator, { config: forwardStraightConfig }))

		expect(screen.getByLabelText('선 색상 색상 선택')).toBeInTheDocument()
		expect(screen.getByRole('slider', { name: '열 간격' })).toHaveAttribute(
			'aria-valuenow',
			'40',
		)
		const gamma = screen.getByRole('slider', { name: '원근 압축' })
		expect(gamma).toHaveAttribute('aria-valuenow', '1')

		gamma.focus()
		await user.keyboard('{ArrowRight}')

		await waitFor(() =>
			expect(mocks.preview.update).toHaveBeenLastCalledWith(
				expect.objectContaining({ perspectiveGamma: 1.1 }),
			),
		)
	})

	it('기본에 없는 컨트롤은 「고급 설정」을 열기 전까지 화면에 없다', async () => {
		const user = userEvent.setup()
		const config = {
			...forwardStraightConfig,
			controller: {
				...forwardStraightConfig.controller,
				// 판에 앉히는 축만 기본 — 나머지 그룹은 통째로 접힌다.
				basic: ['origin'],
			},
		} satisfies GraphicStudioConfig

		render(createElement(GraphicGenerator, { config }))

		// 🔴 접힌 것이 아니라 아예 없어야 한다 — 있으면 스크린리더와 탭 이동에 그대로 잡힌다.
		expect(screen.queryByRole('slider', { name: '열 간격' })).not.toBeInTheDocument()
		expect(screen.queryByRole('slider', { name: '원근 압축' })).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: /고급 설정/ }))

		// 열어도 안쪽 그룹은 전부 닫혀 있다 — 열자마자 40여 개가 쏟아지면 접은 이유가 없다.
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Grid' })).toBeInTheDocument(),
		)
		expect(screen.queryByRole('slider', { name: '열 간격' })).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Grid' }))

		await waitFor(() =>
			expect(screen.getByRole('slider', { name: '열 간격' })).toBeInTheDocument(),
		)
		expect(screen.getByRole('slider', { name: '행 간격' })).toBeInTheDocument()
		// 다른 그룹은 여전히 닫혀 있다 — 하나를 열어도 나머지가 따라 열리지 않는다.
		expect(screen.queryByRole('slider', { name: '원근 압축' })).not.toBeInTheDocument()
	})

	it('선언이 없는 런타임은 전부 기본이고 「고급 설정」이 뜨지 않는다', () => {
		render(createElement(GraphicGenerator, { config: forwardStraightConfig }))

		expect(screen.getByRole('slider', { name: '행 간격' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /고급 설정/ })).not.toBeInTheDocument()
	})

	it('프리셋을 고르면 값이 들어가고, 컨트롤을 만지면 선택이 풀린다', async () => {
		const user = userEvent.setup()
		const config = {
			...forwardStraightConfig,
			presets: [
				{ id: 'wide', label: '넓게', values: { columnGap: 30, perspectiveGamma: 1.4 } },
			],
		} satisfies GraphicStudioConfig

		render(createElement(GraphicGenerator, { config }))

		const preset = screen.getByRole('combobox', { name: '프리셋' })
		expect(preset).toHaveTextContent('직접 설정')

		preset.focus()
		await user.keyboard('{ArrowDown}{Enter}')

		await waitFor(() => expect(preset).toHaveTextContent('넓게'))
		expect(screen.getByRole('slider', { name: '열 간격' })).toHaveAttribute(
			'aria-valuenow',
			'30',
		)
		expect(screen.getByRole('slider', { name: '원근 압축' })).toHaveAttribute(
			'aria-valuenow',
			'1.4',
		)

		// 🔴 값이 아니라 UX 상태다 — 하나만 만져도 풀리고, 되돌려도 다시 붙지 않는다.
		const gamma = screen.getByRole('slider', { name: '원근 압축' })
		gamma.focus()
		await user.keyboard('{ArrowRight}')

		await waitFor(() => expect(preset).toHaveTextContent('직접 설정'))
		expect(screen.getByRole('slider', { name: '열 간격' })).toHaveAttribute(
			'aria-valuenow',
			'30',
		)
	})

	it('Raster Artifact가 있는 Graphic은 공통 PNG adapter를 실행할 수 있다', async () => {
		const config = {
			...forwardStraightRuntimeManifest,
			output: {
				...resolveGraphicStudioOutput(forwardStraightRuntimeManifest),
				formats: ['png'],
			},
		} satisfies GraphicStudioConfig

		render(createElement(GraphicGenerator, { config: config }))

		await waitFor(() => expect(mocks.createPreview).toHaveBeenCalledOnce())
		expect(screen.getByText('PNG')).toBeInTheDocument()
		await waitFor(() => expect(screen.getByRole('button', { name: '내보내기' })).toBeEnabled())
	})

	it('Shader Definition을 WebGL preview와 MP4 Export UI에 연결한다', async () => {
		const { unmount } = render(
			createElement(GraphicGenerator, { config: radialFlutedGlassConfig }),
		)

		await waitFor(() =>
			expect(mocks.createShaderPreview).toHaveBeenCalledWith(
				expect.objectContaining({ input: RADIAL_FLUTED_GLASS_DEFAULT_INPUT }),
			),
		)
		// 이 런타임은 기본 컨트롤을 선언하지 않으므로 전부 기본이고 「고급 설정」이 없다.
		expect(screen.queryByRole('button', { name: /고급 설정/ })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Ray Palette' })).toBeInTheDocument()
		expect(screen.getByText('Rays')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Pulse' })).toBeInTheDocument()
		expect(screen.getByText('Glass')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Glass Motion' })).toBeInTheDocument()
		expect(screen.getByText('Position')).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: '왜곡 형태' })).toHaveTextContent('Lens')
		expect(screen.getByRole('spinbutton', { name: 'Width' })).toHaveValue(1920)
		expect(screen.getByRole('spinbutton', { name: 'Height' })).toHaveValue(1080)
		expect(screen.getByRole('combobox', { name: 'FPS' })).toHaveTextContent('30')
		expect(screen.getByRole('spinbutton', { name: 'Duration' })).toHaveValue(5)
		await waitFor(() => expect(screen.getByRole('button', { name: '내보내기' })).toBeEnabled())

		fireEvent.keyDown(screen.getByRole('slider', { name: '광선 강도' }), {
			key: 'ArrowRight',
		})
		await waitFor(() =>
			expect(mocks.shaderPreview.update).toHaveBeenLastCalledWith(
				expect.objectContaining({ rayIntensity: 0.96 }),
			),
		)

		unmount()
		expect(mocks.shaderPreview.destroy).toHaveBeenCalledOnce()
	})

	it('VideoControls 변경값을 MP4 ExportRequest에 연결한다', async () => {
		const user = userEvent.setup()
		const createObjectURL = vi.fn(() => 'blob:radial-fluted-glass')
		Object.defineProperty(URL, 'createObjectURL', {
			configurable: true,
			value: createObjectURL,
		})
		Object.defineProperty(URL, 'revokeObjectURL', {
			configurable: true,
			value: vi.fn(),
		})
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

		render(createElement(GraphicGenerator, { config: radialFlutedGlassConfig }))
		await waitFor(() => expect(mocks.createShaderPreview).toHaveBeenCalledOnce())

		const width = screen.getByRole('spinbutton', { name: 'Width' })
		fireEvent.change(width, { target: { value: '1280' } })
		fireEvent.blur(width)
		const height = screen.getByRole('spinbutton', { name: 'Height' })
		fireEvent.change(height, { target: { value: '720' } })
		fireEvent.blur(height)
		const duration = screen.getByRole('spinbutton', { name: 'Duration' })
		fireEvent.change(duration, { target: { value: '10' } })
		fireEvent.blur(duration)
		const fps = screen.getByRole('combobox', { name: 'FPS' })
		fps.focus()
		await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
		await user.click(screen.getByRole('button', { name: '내보내기' }))

		await waitFor(() =>
			expect(mocks.canvasFramesToMp4).toHaveBeenCalledWith(
				expect.objectContaining({
					canvas: mocks.shaderPreview.artifacts.video.source.canvas,
					spec: expect.objectContaining({
						width: 1280,
						height: 720,
						fps: 60,
						durationSeconds: 10,
					}),
				}),
			),
		)
		expect(createObjectURL).toHaveBeenCalledOnce()
	})

	it('출력 사이즈 비율을 프리뷰 영역에 맞춰 반영한다', async () => {
		render(createElement(GraphicGenerator, { config: radialFlutedGlassConfig }))
		await waitFor(() => expect(mocks.createShaderPreview).toHaveBeenCalledOnce())
		const observerCount = mocks.resizeObserverCount

		const width = screen.getByRole('spinbutton', { name: 'Width' })
		fireEvent.change(width, { target: { value: '800' } })
		fireEvent.blur(width)
		const height = screen.getByRole('spinbutton', { name: 'Height' })
		fireEvent.change(height, { target: { value: '800' } })
		fireEvent.blur(height)
		await waitFor(() => expect(mocks.resizeObserverCount).toBeGreaterThan(observerCount))

		act(() => {
			mocks.resizeObserverCallback?.(
				[
					{
						contentRect: { width: 1000, height: 800 },
					} as ResizeObserverEntry,
				],
				{} as ResizeObserver,
			)
		})

		expect(mocks.shaderPreview.resize).toHaveBeenLastCalledWith(800, 800)
	})

	it('등록된 id와 type이 일치하지 않으면 런타임을 실행하지 않는다', async () => {
		render(
			createElement(GraphicGenerator, {
				config: { ...forwardStraightConfig, type: 'shader' },
			}),
		)

		expect(await screen.findByRole('alert')).toHaveTextContent('지원하지 않는 그래픽 런타임')
		expect(mocks.createPreview).not.toHaveBeenCalled()
	})

	it('런타임이 명시한 origin Pad에만 캔버스 비율을 연결한다', async () => {
		const config = {
			...forwardStraightConfig,
			controller: {
				groups: forwardStraightRuntimeManifest.controller.groups.map((group) =>
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

		render(createElement(GraphicGenerator, { config: config }))
		await waitFor(() =>
			expect(screen.getByRole('slider', { name: '기준점' })).toHaveStyle({
				aspectRatio: '1.3333333333333333',
			}),
		)
		expect(screen.getByRole('slider', { name: 'Offset' }).style.aspectRatio).toBe('')
	})

	it('readonly control은 캔버스 직접 조작으로도 변경하지 않는다', async () => {
		const config = {
			...forwardStraightConfig,
			controller: {
				groups: forwardStraightRuntimeManifest.controller.groups.map((group) =>
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

		render(createElement(GraphicGenerator, { config: config }))
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
		render(createElement(GraphicGenerator, { config: forwardStraightConfig }))
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
			createElement(GraphicGenerator, { config: forwardStraightConfig }),
		)

		await waitFor(() => expect(mocks.createPreview).toHaveBeenCalledOnce())
		fireEvent.keyDown(screen.getByRole('slider', { name: '기준점' }), { key: 'ArrowRight' })
		await waitFor(() =>
			expect(mocks.preview.update).toHaveBeenLastCalledWith(
				expect.objectContaining({ origin: { x: 0.525, y: 0.5 } }),
			),
		)
		const width = screen.getByRole('spinbutton', { name: 'Width' })
		fireEvent.change(width, { target: { value: '640' } })
		fireEvent.blur(width)
		fireEvent.click(screen.getByRole('button', { name: '내보내기' }))
		await waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce())

		const blob = createObjectURL.mock.calls[0]?.[0] as Blob
		expect(blob).toMatchObject({ type: 'image/svg+xml' })
		const svg = await new Promise<string>((resolve) => {
			const reader = new FileReader()
			reader.onload = () => resolve(String(reader.result))
			reader.readAsText(blob)
		})
		const expected = createForwardStraightScene(
			{ ...FORWARD_STRAIGHT_DEFAULT_INPUT, origin: { x: 0.525, y: 0.5 } },
			{ width: 640, height: 600 },
		)
		expect(svg).toContain('width="640" height="600"')
		expect(svg.split('<line').length - 1).toBe(expected.dashes.length)
		expect(svg).toContain(`x1="${expected.dashes[0].x1.toFixed(2)}"`)
		expect(click.mock.instances[0]).toMatchObject({
			download: 'forward-straight.svg',
			href: 'blob:forward-straight',
		})
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:forward-straight')

		unmount()
		expect(mocks.preview.destroy).toHaveBeenCalledOnce()
	})

	it('Change 브라우저에서 Graphic을 교체하고 새 계약의 기본값으로 초기화한다', async () => {
		// 교체 후보 목록은 패널이 열릴 때 /api/graphic-profiles에서 온다.
		browseMocks.fetchGraphicStudioConfigs.mockResolvedValue([
			forwardStraightConfig,
			radialFlutedGlassConfig,
		])
		render(createElement(GraphicGenerator, { config: forwardStraightConfig }))
		await waitFor(() => expect(mocks.createPreview).toHaveBeenCalledOnce())
		const gamma = screen.getByRole('slider', { name: '원근 압축' })
		fireEvent.keyDown(gamma, { key: 'ArrowRight' })
		await waitFor(() => expect(gamma).not.toHaveAttribute('aria-valuenow', '1'))

		const trigger = screen.getByRole('button', { name: '그래픽 변경' })
		expect(trigger.closest('[data-slot="controller-header"]')).not.toBeNull()
		fireEvent.click(trigger)
		const panel = screen.getByRole('dialog', { name: 'Graphic Profiles' })
		const forwardCard = await within(panel).findByRole('button', {
			name: new RegExp(forwardStraightRuntimeManifest.name),
		})
		const shaderCard = within(panel).getByRole('button', {
			name: new RegExp(radialFlutedGlassRuntimeManifest.name),
		})
		expect(forwardCard).toHaveAttribute('aria-current', 'true')

		fireEvent.click(shaderCard)
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		await waitFor(() => expect(mocks.createShaderPreview).toHaveBeenCalledOnce())
		expect(mocks.preview.destroy).toHaveBeenCalledOnce()

		fireEvent.click(screen.getByRole('button', { name: '그래픽 변경' }))
		fireEvent.click(
			await within(screen.getByRole('dialog', { name: 'Graphic Profiles' })).findByRole(
				'button',
				{ name: new RegExp(forwardStraightRuntimeManifest.name) },
			),
		)

		await waitFor(() => expect(mocks.createPreview).toHaveBeenCalledTimes(2))
		expect(screen.getByRole('slider', { name: '원근 압축' })).toHaveAttribute(
			'aria-valuenow',
			'1',
		)
	})
})
