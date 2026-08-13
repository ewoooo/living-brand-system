import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TemplateSidebar } from '@/components/studio/sidebar/template-sidebar'
import type { GraphicRuntimeManifest } from '@/features/graphic-generation/domain/graphic-studio-config'
import { graphicRuntimeManifests } from '@/features/graphic-generation/domain/graphic-studio-manifest'
import forwardStraightRuntimeManifest from '@/features/graphic-generation/graphic-runtimes/forward-straight/definition'
import type { ImageStudioConfig } from '@/features/image-generation/domain/image-studio-config'
import { useTemplateExport } from '@/features/studio-export/hooks/use-template-export'
import {
	deriveTemplateConfig,
	type PublishedHtmlTemplate,
} from '@/features/template-customization/domain/template-config'
import {
	TemplateStudioProvider,
	useTemplateStudio,
} from '@/features/template-customization/hooks/use-template-studio'
import type { GetCreateNavigationOutput } from '@/features/template-customization/services/get-create-navigation.service'
import { TemplateGenerator as TemplateGeneratorView } from './template-generator'

const mocks = vi.hoisted(() => ({
	canExportTemplate: vi.fn(() => true),
	captureGraphicFrame: vi.fn(() => 'data:image/png;base64,graphic'),
	destroyGraphicPreview: vi.fn(),
	exportTemplate: vi.fn(),
	mountGraphicPreview: vi.fn(),
	push: vi.fn(),
	requestImageGeneration: vi.fn(),
	resizeGraphicPreview: vi.fn(),
	resizeObserverCallback: undefined as ResizeObserverCallback | undefined,
	templateArtifact: undefined as
		| (() => { kind: 'raster'; source: { height: number; html: string; width: number } })
		| undefined,
	updateGraphicPreview: vi.fn(),
}))

vi.mock('@/features/studio-export/hooks/use-export', () => ({
	useExport: () => ({
		canExport: mocks.canExportTemplate,
		exporting: null,
		error: null,
		run: (request: { format: string }) => mocks.exportTemplate(request.format),
	}),
}))
vi.mock('@/features/studio-export/services/export-template.client', () => ({
	createTemplateExportSource: (
		artifact: () => { kind: 'raster'; source: { height: number; html: string; width: number } },
	) => {
		mocks.templateArtifact = artifact
		return {}
	},
}))
vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mocks.push }),
}))
vi.mock('@/features/image-generation/services/generate-image.client', () => ({
	requestImageGeneration: mocks.requestImageGeneration,
}))
vi.mock('@/features/graphic-generation/runtime/client/graphic-runtime.client', () => ({
	getGraphicRuntimeAdapter: (config: GraphicRuntimeManifest) => ({
		type: config.type,
		mount: mocks.mountGraphicPreview,
	}),
}))

const template: PublishedHtmlTemplate = {
	kind: 'html',
	id: 1,
	name: '테스트 템플릿',
	html: '<div>미리보기</div>',
	nodeConfigs: {},
	width: 400,
	height: 300,
	templateVersion: '2026-07-29T00:00:00.000Z',
}

const navigation: GetCreateNavigationOutput = {
	categories: [
		{
			id: 1,
			title: '카드',
			slug: 'cards',
			href: '/studio/template/cards',
			templates: [
				{ id: 1, name: '테스트 템플릿', href: '/studio/template/cards/1' },
				{ id: 2, name: '두 번째 템플릿', href: '/studio/template/cards/2' },
			],
		},
	],
}

const imageConfigs = [createImageConfig(11), createImageConfig(7)]

function TemplateGenerator({
	imageConfigs: providedImageConfigs = imageConfigs,
	graphicConfigs: providedGraphicConfigs = graphicRuntimeManifests,
	...props
}: Omit<ComponentProps<typeof TemplateGeneratorView>, 'config'> & {
	imageConfigs?: readonly ImageStudioConfig[]
	graphicConfigs?: readonly GraphicRuntimeManifest[]
}) {
	return (
		<TemplateGeneratorView
			{...props}
			config={deriveTemplateConfig(
				props.template,
				providedImageConfigs,
				providedGraphicConfigs,
			)}
		/>
	)
}

function FeatureMutationProbe() {
	const { images, background } = useTemplateStudio()
	const image = images.states['1:1']
	return (
		<>
			<span data-testid="image-line">{String(image?.featureValues.lineColor)}</span>
			<span data-testid="background-line">
				{String(background.state.featureValues.lineColor)}
			</span>
			<button
				type="button"
				onClick={() => images.updateFeature('1:1', 'lineColor', 'invalid')}
			>
				invalid image feature
			</button>
			<button
				type="button"
				onClick={() => images.updateFeature('1:1', 'lineColor', '#00ff00')}
			>
				valid image feature
			</button>
			<button type="button" onClick={() => background.updateFeature('lineColor', '#00ff00')}>
				background feature
			</button>
		</>
	)
}

function GraphicMutationProbe() {
	const { background } = useTemplateStudio()
	return (
		<>
			<span data-testid="graphic-config">{background.state.graphicConfigId}</span>
			<span data-testid="graphic-viewpoint">
				{String(background.state.graphicValues.viewpoint)}
			</span>
			<button
				type="button"
				onClick={() => background.updateGraphic('viewpoint', 'low-angle')}
			>
				update graphic
			</button>
			<button type="button" onClick={() => background.updateGraphic('viewpoint', 'invalid')}>
				invalid graphic
			</button>
			<button type="button" onClick={() => background.selectGraphicConfig('secondary')}>
				select secondary graphic
			</button>
		</>
	)
}

function TemplateOutputProbe() {
	const exporting = useTestTemplateExport()
	return (
		<>
			<span data-testid="template-output-format">{exporting.format ?? 'none'}</span>
			<span data-testid="template-output-formats">
				{exporting.formats.join(',') || 'none'}
			</span>
			<button type="button" onClick={exporting.run}>
				export unsupported svg
			</button>
		</>
	)
}

function TemplateSidebarTestBridge() {
	return <TemplateSidebar exporting={useTestTemplateExport()} />
}

function useTestTemplateExport() {
	const { canvas, config, execution } = useTemplateStudio()
	return useTemplateExport({
		artifact: canvas.artifact,
		capability: config.output,
		metadata: {
			fileName: template.name,
			printPpi: template.printPpi,
			templateId: template.id,
			templateVersion: template.templateVersion,
			controller: {
				groups: config.controller.groups,
				values: execution.controllerValues,
			},
		},
	})
}

function BackgroundTypeMutationProbe() {
	const { background } = useTemplateStudio()
	return (
		<>
			<span data-testid="background-type">{background.state.type}</span>
			<button type="button" onClick={() => background.selectType('graphic')}>
				select graphic background
			</button>
			<button type="button" onClick={() => background.selectType('invalid')}>
				select invalid background
			</button>
			<button type="button" onClick={() => background.update({ type: 'graphic' } as never)}>
				patch graphic background
			</button>
		</>
	)
}

function GraphicCaptureProbe() {
	const { background, canvas } = useTemplateStudio()
	useEffect(() => {
		mocks.templateArtifact = canvas.artifact
		canvas.registerGraphicFrame(mocks.captureGraphicFrame)
		return () => {
			mocks.templateArtifact = undefined
			canvas.registerGraphicFrame(null)
		}
	}, [canvas])
	return (
		<button type="button" onClick={() => background.selectType('graphic')}>
			select graphic for export
		</button>
	)
}

function TemplateControlMutationProbe() {
	const { text, background } = useTemplateStudio()
	return (
		<>
			<span data-testid="template-text">{text.values['1:1']}</span>
			<span data-testid="template-text-color">{text.color}</span>
			<span data-testid="template-background-color">{background.state.color}</span>
			<button type="button" onClick={() => text.setValue('1:1', '변경 제목')}>
				change template text
			</button>
			<button type="button" onClick={() => text.setColor('#abcdef')}>
				change template text color
			</button>
			<button type="button" onClick={() => background.setColor('#abcdef')}>
				change template background color
			</button>
		</>
	)
}

function ImageRaceProbe() {
	const { images } = useTemplateStudio()
	const state = images.states['1:1']
	return (
		<>
			<span data-testid="slot-profile">{state?.profileId}</span>
			<span data-testid="slot-generating">{String(state?.generating)}</span>
			<span data-testid="slot-image-profile">{state?.image?.profileId ?? 'none'}</span>
			<button type="button" onClick={() => void images.generate('1:1')}>
				start slot generation
			</button>
			<button type="button" onClick={() => images.selectProfile('1:1', 7)}>
				select slot profile
			</button>
			<button type="button" onClick={() => images.update('1:1', { profileId: 7 } as never)}>
				patch slot profile
			</button>
			<button
				type="button"
				onClick={() => {
					images.selectProfile('1:1', 7)
					void images.generate('1:1')
				}}
			>
				race slot profile
			</button>
		</>
	)
}

describe('TemplateGenerator', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.captureGraphicFrame.mockReturnValue('data:image/png;base64,graphic')
		mocks.canExportTemplate.mockReturnValue(true)
		mocks.mountGraphicPreview.mockResolvedValue({
			captureFrame: mocks.captureGraphicFrame,
			destroy: mocks.destroyGraphicPreview,
			getViewport: () => ({ width: 400, height: 300 }),
			resize: mocks.resizeGraphicPreview,
			update: mocks.updateGraphicPreview,
		})
		mocks.resizeObserverCallback = undefined
		mocks.templateArtifact = undefined
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(callback: ResizeObserverCallback) {
					mocks.resizeObserverCallback = callback
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

	it('공통 Studio 작업대에서 템플릿을 내보낸다', () => {
		const { container } = render(
			<TemplateGenerator navigation={navigation} template={template} />,
		)

		expect(container.querySelector('[data-slot="studio-workspace"]')).not.toBeNull()
		expect(container.querySelector('[data-slot="studio-workspace-sidebar"]')).not.toBeNull()
		expect(container.querySelector('[data-slot="studio-workspace-canvas"]')).not.toBeNull()
		expect(container.querySelector('[data-slot="studio-sidebar"]')).not.toBeNull()
		const header = container.querySelector('[data-slot="controller-header"]')
		expect(header).not.toBeNull()
		expect(
			within(header as HTMLElement).getByRole('combobox', { name: '템플릿 변경' }),
		).toBeInTheDocument()

		fireEvent.click(screen.getByRole('button', { name: '내보내기' }))

		// 포맷 셀렉트 기본값인 PNG 요청이 공통 useExport로 전달된다.
		expect(mocks.exportTemplate).toHaveBeenCalledWith('png')
	})

	it('공통 Export 판정이 거부하면 Format이 있어도 내보내기 버튼을 잠근다', () => {
		mocks.canExportTemplate.mockReturnValue(false)
		render(<TemplateGenerator navigation={navigation} template={template} />)

		expect(screen.getByRole('button', { name: '내보내기' })).toBeDisabled()
	})

	it('UI는 Effective Config 포맷을 표시하고 Template adapter가 없는 요청은 실행 직전 차단한다', () => {
		const derived = deriveTemplateConfig(template, imageConfigs, graphicRuntimeManifests)
		const config = { ...derived, output: { ...derived.output, formats: ['svg'] as const } }
		render(
			<TemplateStudioProvider config={config} template={template} navigation={navigation}>
				<TemplateOutputProbe />
			</TemplateStudioProvider>,
		)

		expect(screen.getByTestId('template-output-format')).toHaveTextContent('svg')
		expect(screen.getByTestId('template-output-formats')).toHaveTextContent('svg')
		fireEvent.click(screen.getByRole('button', { name: 'export unsupported svg' }))
		expect(mocks.exportTemplate).not.toHaveBeenCalled()
	})

	it('Raster Artifact producer는 export 실행 시점의 그래픽 프레임을 합성한다', () => {
		mocks.captureGraphicFrame.mockReturnValue('/graphic-frame.png')
		render(
			<TemplateStudioProvider
				config={deriveTemplateConfig(template, imageConfigs, graphicRuntimeManifests)}
				template={template}
				navigation={navigation}
			>
				<GraphicCaptureProbe />
			</TemplateStudioProvider>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'select graphic for export' }))
		const artifact = mocks.templateArtifact?.()
		mocks.captureGraphicFrame.mockReturnValue('/newest-graphic-frame.png')
		mocks.templateArtifact?.()

		expect(mocks.captureGraphicFrame).toHaveBeenCalledTimes(2)
		expect(artifact).toMatchObject({
			kind: 'raster',
			source: { height: 300, width: 400 },
		})
	})

	it('출력 캔버스 비율을 작업 영역에 맞춰 프리뷰에 반영한다', () => {
		const { container } = render(
			<TemplateGenerator navigation={navigation} template={template} />,
		)

		act(() => {
			mocks.resizeObserverCallback?.(
				[{ contentRect: { width: 1000, height: 600 } } as ResizeObserverEntry],
				{} as ResizeObserver,
			)
		})

		const preview = container.querySelector<HTMLElement>('[data-slot="template-preview"]')
		expect(preview).toHaveStyle({ width: '800px', height: '600px' })
	})

	it('Template Controller의 readonly 기본값을 세션에 적용하고 Context action에서도 변경을 거부한다', () => {
		const controlledTemplate: PublishedHtmlTemplate = {
			...template,
			html: '<p data-node-id="1:1" data-figma-type="TEXT" data-name="Title">원본 제목</p>',
			nodeConfigs: { '1:1': { input: { label: '제목', maxLength: 20, maxLines: 1 } } },
			controllerRestrictions: {
				controls: [
					{
						controlId: 'text:1:1',
						availability: 'readonly',
						defaultValue: '고정 제목',
						maxLength: 20,
					},
					{
						controlId: 'text.color',
						availability: 'readonly',
						defaultValue: '#112233',
					},
					{
						controlId: 'background.color',
						availability: 'readonly',
						defaultValue: '#ffffff',
					},
				],
			},
		}
		const config = deriveTemplateConfig(controlledTemplate)
		render(
			<TemplateStudioProvider
				config={config}
				template={controlledTemplate}
				navigation={navigation}
			>
				<TemplateControlMutationProbe />
			</TemplateStudioProvider>,
		)

		expect(screen.getByTestId('template-text')).toHaveTextContent('고정 제목')
		expect(screen.getByTestId('template-text-color')).toHaveTextContent('#112233')
		expect(screen.getByTestId('template-background-color')).toHaveTextContent('#ffffff')
		fireEvent.click(screen.getByRole('button', { name: 'change template text' }))
		fireEvent.click(screen.getByRole('button', { name: 'change template text color' }))
		fireEvent.click(screen.getByRole('button', { name: 'change template background color' }))
		expect(screen.getByTestId('template-text')).toHaveTextContent('고정 제목')
		expect(screen.getByTestId('template-text-color')).toHaveTextContent('#112233')
		expect(screen.getByTestId('template-background-color')).toHaveTextContent('#ffffff')
	})

	it('아이덴티티 카드의 Change로 선택한 템플릿 작업대로 이동한다', async () => {
		const user = userEvent.setup()
		render(<TemplateGenerator navigation={navigation} template={template} />)

		// 카드가 현재 템플릿 이름과 카테고리를 보여준다.
		expect(screen.getByText('테스트 템플릿')).toBeInTheDocument()
		expect(screen.getByText('카드')).toBeInTheDocument()

		// jsdom에는 pointer capture가 없어 트리거는 키보드로 연다(radix pointer 경로 회피).
		screen.getByRole('combobox', { name: '템플릿 변경' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: '두 번째 템플릿' }))

		expect(mocks.push).toHaveBeenCalledWith('/studio/template/cards/2')
	})

	it('개방된 이미지 슬롯에서 생성한 이미지를 미리보기에 합성한다', async () => {
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 5, url: '/api/generated-images/file/bg.png' }],
		})
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					// 이미지 슬롯 노드는 임포트가 캐리어로 마킹한 표면이다 — compose는 캐리어 전용.
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: { '1:1': { imageInput: { profileId: 7 } } },
				}}
			/>,
		)

		fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: '파스텔 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.requestImageGeneration).toHaveBeenCalledWith({
			prompt: '파스텔 배경',
			count: 1,
			profileId: 7,
			aspectRatio: '1:1', // 박스가 없으면 선택된 Config의 기본 비율
			imageSize: '2K',
		})
		await waitFor(() =>
			expect(container.innerHTML).toContain('/api/generated-images/file/bg.png'),
		)
	})

	it('저작 config의 imageColorize를 이미지 교체 시 재적용한다', async () => {
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 5, url: '/api/generated-images/file/bg.png' }],
		})
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: {
						'1:1': { imageInput: { profileId: 7 }, imageColorize: { line: '#ff0000' } },
					},
				}}
			/>,
		)

		fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: '파스텔 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		// 호출부가 imageColorize를 깔지 않으면 컬러 치환(마스크 오버레이)이 사라진다 — 그 스프레드를 잡는다.
		await waitFor(() => {
			expect(container.innerHTML).toContain('mask-image')
			expect(container.innerHTML).toContain('rgb(255, 0, 0)')
		})
	})

	it('Image Config가 color-adjustment를 지원하지 않으면 Template 값 override를 적용하지 않는다', async () => {
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 5, url: '/api/generated-images/file/plain.png' }],
		})
		const baseConfig = createImageConfig(7)
		const noColorConfig: ImageStudioConfig = {
			...baseConfig,
			image: {
				...baseConfig.image,
				features: baseConfig.image.features.filter(
					(feature) => feature.type !== 'color-adjustment',
				),
			},
		}
		const { container } = render(
			<TemplateGenerator
				imageConfigs={[noColorConfig]}
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: {
						'1:1': {
							imageInput: { profileId: 7 },
							imageColorize: { line: '#ff0000' },
						},
					},
				}}
			/>,
		)

		fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: '원본 이미지' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		await waitFor(() =>
			expect(container.innerHTML).toContain('/api/generated-images/file/plain.png'),
		)
		expect(container.innerHTML).not.toContain('mask-image')
	})

	it('프로파일을 바꾸면 선택된 Image Config의 feature UI로 즉시 교체한다', async () => {
		const user = userEvent.setup()
		const colorConfig = createImageConfig(11)
		const plainBase = createImageConfig(7)
		const plainConfig: ImageStudioConfig = {
			...plainBase,
			image: {
				...plainBase.image,
				features: plainBase.image.features.filter(
					(feature) => feature.type !== 'color-adjustment',
				),
			},
		}
		const { container } = render(
			<TemplateGenerator
				imageConfigs={[colorConfig, plainConfig]}
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: { '1:1': { imageInput: {} } },
				}}
			/>,
		)
		const slot = container.querySelector<HTMLElement>('[data-slot="image-slot-input"]')
		expect(slot).not.toBeNull()
		if (!slot) return
		expect(within(slot).getByLabelText('Line Color 색상 선택')).toBeInTheDocument()

		within(slot).getByRole('combobox', { name: 'Type' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: '프로파일 7' }))

		await waitFor(() =>
			expect(within(slot).queryByLabelText('Line Color 색상 선택')).toBeNull(),
		)
	})

	it('일괄 텍스트 색을 만졌을 때만 모든 텍스트 슬롯에 합성한다', () => {
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<p data-node-id="t1" style="color:#1a1a1a">TITLE</p><p data-node-id="t2" style="color:#1a1a1a">YEARS</p>',
					nodeConfigs: {
						t1: { input: { label: 'Title' } },
						t2: { input: { label: 'Years' } },
					},
				}}
			/>,
		)

		// 만지기 전 — 저작 색 유지.
		expect(container.innerHTML).not.toContain('rgb(255, 0, 0)')

		fireEvent.change(screen.getByLabelText('Color 색상 선택'), { target: { value: '#ff0000' } })

		const preview = container.querySelector('[data-slot="studio-workspace-canvas"]')
		expect(
			preview?.querySelectorAll('p[style*="rgb(255, 0, 0)"], p[style*="#ff0000"]').length,
		).toBe(2)
	})

	it('사용자 Line Color가 이미지 교체 시 colorize의 line을 갈아끼운다', async () => {
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 5, url: '/api/generated-images/file/bg.png' }],
		})
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: {
						'1:1': { imageInput: { profileId: 7 }, imageColorize: { line: '#ff0000' } },
					},
				}}
			/>,
		)

		fireEvent.change(screen.getByLabelText('Line Color 색상 선택'), {
			target: { value: '#00ff00' },
		})
		fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: '파스텔 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		await waitFor(() => {
			expect(container.innerHTML).toContain('mask-image')
			expect(container.innerHTML).toContain('rgb(0, 255, 0)') // 사용자 색이 저작 line을 대체
		})
	})

	it('생성 후 transform 조작이 편집 transform으로 합성되고, 생성 전에는 비활성이다', async () => {
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 5, url: '/api/generated-images/file/bg.png' }],
		})
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier="" style="width:400px;height:300px;"></div>',
					nodeConfigs: { '1:1': { imageInput: { profileId: 7 } } },
				}}
			/>,
		)

		// 생성 전 — Transform 섹션은 닫힌 채 잠긴다(내용 미노출 + 트리거 비활성).
		expect(screen.getByRole('button', { name: 'Image Transform' })).toBeDisabled()
		expect(screen.queryByRole('slider', { name: '이미지 위치' })).toBeNull()

		fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: '파스텔 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))
		await waitFor(() =>
			expect(container.innerHTML).toContain('/api/generated-images/file/bg.png'),
		)

		// 생성 후 — 잠금이 풀리며 저장된 열림 상태(defaultOpen)로 펼쳐진다.
		expect(screen.getByRole('button', { name: 'Image Transform' })).toBeEnabled()
		const pad = screen.getByRole('slider', { name: '이미지 위치' })
		fireEvent.keyDown(pad, { key: 'ArrowRight' })
		// 패드 0.05 × (400/2) = 10px — 어드민과 같은 compose 포맷으로 prepend된다.
		await waitFor(() =>
			expect(container.innerHTML).toContain('translate(10px, 0px) scale(1) rotate(0deg)'),
		)
	})

	it('만진 배경색이 캔버스(루트 프레임) 배경으로 합성된다', () => {
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" style="width:400px;height:300px;background-color:rgb(0,40,10)"></div>',
				}}
			/>,
		)
		const canvasOf = () =>
			container.querySelector('[data-slot="studio-workspace-canvas"] [data-node-id="1:1"]')

		// 만지기 전 — 저작 배경 유지.
		expect((canvasOf() as HTMLElement).style.backgroundColor).toBe('rgb(0, 40, 10)')

		fireEvent.change(screen.getByLabelText('Background Color 색상 선택'), {
			target: { value: '#ff0000' },
		})

		expect((canvasOf() as HTMLElement).style.backgroundColor).toBe('rgb(255, 0, 0)')
	})

	it('서버가 전달한 Image Config로 배경 이미지를 생성해 캔버스에 깐다', async () => {
		const user = userEvent.setup()
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 9, url: '/api/generated-images/file/canvas.png' }],
		})
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" style="width:400px;height:300px"></div>',
				}}
			/>,
		)

		screen.getByRole('combobox', { name: 'Type' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: 'Image' }))
		await user.click(screen.getByRole('radio', { name: 'Generate' }))
		fireEvent.change(await screen.findByLabelText('Prompt'), { target: { value: '노을 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.requestImageGeneration).toHaveBeenCalledWith({
			prompt: '노을 배경',
			count: 1,
			profileId: 11,
			aspectRatio: '4:3', // 캔버스 400×300에서 파생
			imageSize: '2K',
		})
		await waitFor(() => {
			const canvas = container.querySelector(
				'[data-slot="studio-workspace-canvas"] [data-node-id="1:1"]',
			) as HTMLElement
			expect(canvas.style.backgroundImage).toContain('/api/generated-images/file/canvas.png')
			expect(canvas.style.backgroundSize).toBe('cover')
		})
	})

	it('배경 Image Profile 변경은 새 계약의 prompt 기본값으로 세션을 초기화한다', async () => {
		const user = userEvent.setup()
		render(
			<TemplateGenerator
				imageConfigs={[
					createImageConfig(11),
					createImageConfig(7, undefined, '고정 기본값'),
				]}
				navigation={navigation}
				template={template}
			/>,
		)

		screen.getByRole('combobox', { name: 'Type' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: 'Image' }))
		await user.click(screen.getByRole('radio', { name: 'Generate' }))
		fireEvent.change(await screen.findByLabelText('Prompt'), {
			target: { value: '사용자 입력' },
		})

		screen.getByRole('combobox', { name: 'Image Profile' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: '프로파일 7' }))

		expect(screen.getByLabelText('Prompt')).toHaveValue('고정 기본값')
	})

	it('Graphic Config의 Preview adapter를 실시간 배경으로 마운트하고 타입 전환 시 정리한다', async () => {
		const user = userEvent.setup()
		const { container } = render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" style="width:400px;height:300px;background-color:rgb(0,40,10)"></div>',
				}}
			/>,
		)
		const canvasOf = () =>
			container.querySelector(
				'[data-slot="studio-workspace-canvas"] [data-node-id="1:1"]',
			) as HTMLElement

		screen.getByRole('combobox', { name: 'Type' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: 'Graphic' }))
		await waitFor(() => expect(mocks.mountGraphicPreview).toHaveBeenCalledOnce())
		expect(mocks.mountGraphicPreview).toHaveBeenCalledWith(
			expect.objectContaining({ values: expect.any(Object), onChange: expect.any(Function) }),
		)
		expect(mocks.resizeGraphicPreview).toHaveBeenCalledWith(400, 300)
		expect(canvasOf().style.background).toBe('transparent')
		expect(container.querySelector('[data-slot="template-graphic-background"]')).not.toBeNull()

		screen.getByRole('combobox', { name: 'Graphic Type' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: 'Radial Fluted Glass' }))
		await waitFor(() => expect(mocks.mountGraphicPreview).toHaveBeenCalledTimes(2))
		expect(mocks.destroyGraphicPreview).toHaveBeenCalledOnce()
		fireEvent.keyDown(screen.getByRole('slider', { name: '광선 강도' }), {
			key: 'ArrowRight',
		})
		await waitFor(() =>
			expect(mocks.updateGraphicPreview).toHaveBeenLastCalledWith(
				expect.objectContaining({ rayIntensity: 0.83 }),
			),
		)
		expect(canvasOf().style.background).toBe('transparent')

		screen.getByRole('combobox', { name: 'Type' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: 'Color' }))
		await waitFor(() => expect(mocks.destroyGraphicPreview).toHaveBeenCalledTimes(2))
		fireEvent.change(screen.getByLabelText('Background Color 색상 선택'), {
			target: { value: '#ff0000' },
		})
		expect(canvasOf().style.backgroundImage).toBe('')
		expect(canvasOf().style.backgroundColor).toBe('rgb(255, 0, 0)')

		screen.getByRole('combobox', { name: 'Type' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: 'Graphic' }))
		await waitFor(() => expect(mocks.mountGraphicPreview).toHaveBeenCalledTimes(3))
		expect(canvasOf().style.background).toBe('transparent')
	})

	it('선택한 포맷으로 내보낸다 — 편집 계약(printPpi 정책)이 허용한 포맷만 목록에 오른다', async () => {
		const user = userEvent.setup()
		render(
			<TemplateGenerator navigation={navigation} template={{ ...template, printPpi: 150 }} />,
		)

		screen.getByRole('combobox', { name: 'Format' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: 'CMYK PDF' }))
		fireEvent.click(screen.getByRole('button', { name: '내보내기' }))

		expect(mocks.exportTemplate).toHaveBeenCalledWith('pdf')
	})

	it('Image Config가 없으면 pinned과 selectable 슬롯 모두 생성 불가 이유를 보여준다', async () => {
		const pinned = render(
			<TemplateGenerator
				imageConfigs={[]}
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: { '1:1': { imageInput: { profileId: 7 } } },
				}}
			/>,
		)
		expect(
			pinned.container.querySelector('[data-slot="image-slot-input"]')?.textContent,
		).toContain('고정된 이미지 프로파일을 사용할 수 없습니다.')
		pinned.unmount()

		render(
			<TemplateGenerator
				imageConfigs={[]}
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: { '1:1': { imageInput: {} } },
				}}
			/>,
		)
		expect(screen.getByText('사용 가능한 이미지 프로파일이 없습니다.')).toBeInTheDocument()
	})

	it('슬롯 박스가 있으면 가장 가까운 지원 비율을 생성 요청에 싣는다', () => {
		mocks.requestImageGeneration.mockResolvedValue({ generatedImages: [] })
		render(
			<TemplateGenerator
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" style="width:911px;height:492px;"></div>',
					nodeConfigs: { '1:1': { imageInput: { profileId: 7 } } },
				}}
			/>,
		)

		expect(screen.getByText('16:9')).toBeInTheDocument()
		fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: '파스텔 배경' } })
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.requestImageGeneration).toHaveBeenCalledWith({
			prompt: '파스텔 배경',
			count: 1,
			profileId: 7,
			aspectRatio: '16:9',
			imageSize: '2K',
		})
	})

	it.each([
		'readonly',
		'disabled',
	] as const)('prompt가 %s면 수정 없이 Admin default 그대로 생성한다', async (availability) => {
		const fixedConfig = createImageConfig(7, availability, '고정 프롬프트')
		mocks.requestImageGeneration.mockResolvedValue({ generatedImages: [] })
		render(
			<TemplateGenerator
				imageConfigs={[fixedConfig]}
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: { '1:1': { imageInput: { profileId: 7 } } },
				}}
			/>,
		)

		if (availability === 'readonly') {
			expect(screen.getByText('고정 프롬프트')).toBeInTheDocument()
		} else {
			expect(screen.getByDisplayValue('고정 프롬프트')).toBeDisabled()
		}
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		await waitFor(() =>
			expect(mocks.requestImageGeneration).toHaveBeenCalledWith({
				prompt: '고정 프롬프트',
				count: 1,
				profileId: 7,
				aspectRatio: '1:1',
				imageSize: '2K',
			}),
		)
	})

	it.each([
		'readonly',
		'disabled',
	] as const)('Background Type이 %s면 action과 generic patch로 우회할 수 없다', (availability) => {
		const base = deriveTemplateConfig(template, imageConfigs, graphicRuntimeManifests)
		const config = {
			...base,
			controller: {
				groups: base.controller.groups.map((group) => ({
					...group,
					controls: group.controls.map((control) =>
						control.id === 'background.type' ? { ...control, availability } : control,
					),
				})),
			},
		} satisfies typeof base
		render(
			<TemplateStudioProvider config={config} template={template} navigation={navigation}>
				<BackgroundTypeMutationProbe />
			</TemplateStudioProvider>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'select graphic background' }))
		fireEvent.click(screen.getByRole('button', { name: 'select invalid background' }))
		fireEvent.click(screen.getByRole('button', { name: 'patch graphic background' }))
		expect(screen.getByTestId('background-type')).toHaveTextContent('color')
	})

	it('이미지 생성 중 Profile action·generic patch를 막고 stale 응답을 기록하지 않는다', async () => {
		const studioTemplate: PublishedHtmlTemplate = {
			...template,
			html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
			nodeConfigs: { '1:1': { imageInput: {} } },
		}
		const configs = [
			createImageConfig(11, undefined, '첫 프롬프트'),
			createImageConfig(7, undefined, '둘째 프롬프트'),
		]
		const config = deriveTemplateConfig(studioTemplate, configs, graphicRuntimeManifests)
		let resolveFirst:
			| ((value: { generatedImages: { id: number; url: string }[] }) => void)
			| null = null
		mocks.requestImageGeneration.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveFirst = resolve
			}),
		)
		const first = render(
			<TemplateStudioProvider
				config={config}
				template={studioTemplate}
				navigation={navigation}
			>
				<TemplateSidebarTestBridge />
				<ImageRaceProbe />
			</TemplateStudioProvider>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'start slot generation' }))
		expect(screen.getByTestId('slot-generating')).toHaveTextContent('true')
		const slot = first.container.querySelector<HTMLElement>('[data-slot="image-slot-input"]')
		expect(slot).not.toBeNull()
		if (!slot) return
		expect(within(slot).getByRole('combobox', { name: 'Type' })).toBeDisabled()
		fireEvent.click(screen.getByRole('button', { name: 'select slot profile' }))
		fireEvent.click(screen.getByRole('button', { name: 'patch slot profile' }))
		expect(screen.getByTestId('slot-profile')).toHaveTextContent('11')
		await act(async () => {
			resolveFirst?.({ generatedImages: [{ id: 1, url: '/generated/first.png' }] })
		})
		await waitFor(() =>
			expect(screen.getByTestId('slot-image-profile')).toHaveTextContent('11'),
		)
		first.unmount()

		let resolveRace:
			| ((value: { generatedImages: { id: number; url: string }[] }) => void)
			| null = null
		mocks.requestImageGeneration.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveRace = resolve
			}),
		)
		render(
			<TemplateStudioProvider
				config={config}
				template={studioTemplate}
				navigation={navigation}
			>
				<ImageRaceProbe />
			</TemplateStudioProvider>,
		)
		fireEvent.click(screen.getByRole('button', { name: 'race slot profile' }))
		expect(screen.getByTestId('slot-profile')).toHaveTextContent('7')
		await act(async () => {
			resolveRace?.({ generatedImages: [{ id: 2, url: '/generated/stale.png' }] })
		})
		await waitFor(() =>
			expect(screen.getByTestId('slot-generating')).toHaveTextContent('false'),
		)
		expect(screen.getByTestId('slot-image-profile')).toHaveTextContent('none')
	})

	it('완료된 이미지는 Profile 변경 후 보존하되 이전 Profile 색상 feature를 합성하지 않는다', async () => {
		const user = userEvent.setup()
		mocks.requestImageGeneration.mockResolvedValue({
			generatedImages: [{ id: 5, url: '/api/generated-images/file/preserved.png' }],
		})
		const { container } = render(
			<TemplateGenerator
				imageConfigs={[createImageConfig(11), createImageConfig(7)]}
				navigation={navigation}
				template={{
					...template,
					html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
					nodeConfigs: { '1:1': { imageInput: {} } },
				}}
			/>,
		)
		const slot = container.querySelector<HTMLElement>('[data-slot="image-slot-input"]')
		expect(slot).not.toBeNull()
		if (!slot) return

		fireEvent.change(within(slot).getByLabelText('Prompt'), {
			target: { value: '컬러 이미지' },
		})
		fireEvent.click(within(slot).getByRole('button', { name: '이미지 생성' }))
		await waitFor(() => expect(container.innerHTML).toContain('mask-image'))

		within(slot).getByRole('combobox', { name: 'Type' }).focus()
		await user.keyboard('{ArrowDown}')
		await user.click(screen.getByRole('option', { name: '프로파일 7' }))
		await waitFor(() => expect(container.innerHTML).not.toContain('mask-image'))
		expect(container.innerHTML).toContain('/api/generated-images/file/preserved.png')
	})

	it('feature action과 Template override는 Definition·availability·Background runtime 잠금을 우회하지 않는다', () => {
		const editable = createImageConfig(7)
		const studioTemplate: PublishedHtmlTemplate = {
			...template,
			html: '<div data-node-id="1:1" data-figma-type="FRAME" data-name="배경" data-image-carrier=""></div>',
			nodeConfigs: { '1:1': { imageInput: { profileId: 7 } } },
		}
		const first = render(
			<TemplateStudioProvider
				config={deriveTemplateConfig(studioTemplate, [editable])}
				template={studioTemplate}
				navigation={navigation}
			>
				<FeatureMutationProbe />
			</TemplateStudioProvider>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'invalid image feature' }))
		expect(screen.getByTestId('image-line')).toHaveTextContent('#000000')
		fireEvent.click(screen.getByRole('button', { name: 'valid image feature' }))
		expect(screen.getByTestId('image-line')).toHaveTextContent('#00ff00')
		fireEvent.click(screen.getByRole('button', { name: 'background feature' }))
		expect(screen.getByTestId('background-line')).toHaveTextContent('#000000')
		first.unmount()

		const readonlyConfig: ImageStudioConfig = {
			...editable,
			controller: {
				groups: editable.controller.groups.map((group) => ({
					...group,
					controls: group.controls.map((control) =>
						control.id === 'lineColor'
							? { ...control, availability: 'readonly' as const }
							: control,
					),
				})),
			},
		}
		const overrideTemplate: PublishedHtmlTemplate = {
			...studioTemplate,
			nodeConfigs: {
				'1:1': {
					imageInput: { profileId: 7 },
					imageColorize: { line: '#ff0000' },
				},
			},
		}
		render(
			<TemplateStudioProvider
				config={deriveTemplateConfig(overrideTemplate, [readonlyConfig])}
				template={overrideTemplate}
				navigation={navigation}
			>
				<FeatureMutationProbe />
			</TemplateStudioProvider>,
		)
		expect(screen.getByTestId('image-line')).toHaveTextContent('#000000')
		fireEvent.click(screen.getByRole('button', { name: 'valid image feature' }))
		expect(screen.getByTestId('image-line')).toHaveTextContent('#000000')
	})

	it('Graphic update는 Definition availability를 지키고 Config 변경 시 기본값으로 초기화한다', () => {
		const readonlyGraphic: GraphicRuntimeManifest = {
			...forwardStraightRuntimeManifest,
			controller: {
				groups: forwardStraightRuntimeManifest.controller.groups.map((group) => ({
					...group,
					controls: group.controls.map((control) =>
						control.id === 'viewpoint'
							? { ...control, availability: 'readonly' as const }
							: control,
					),
				})),
			},
		}
		const first = render(
			<TemplateStudioProvider
				config={deriveTemplateConfig(template, imageConfigs, [readonlyGraphic])}
				template={template}
				navigation={navigation}
			>
				<GraphicMutationProbe />
			</TemplateStudioProvider>,
		)

		fireEvent.click(screen.getByRole('button', { name: 'update graphic' }))
		expect(screen.getByTestId('graphic-viewpoint')).toHaveTextContent('flat')
		fireEvent.click(screen.getByRole('button', { name: 'invalid graphic' }))
		expect(screen.getByTestId('graphic-viewpoint')).toHaveTextContent('flat')
		first.unmount()

		const secondary = {
			...forwardStraightRuntimeManifest,
			id: 'secondary',
			name: 'Secondary',
		} satisfies GraphicRuntimeManifest
		render(
			<TemplateStudioProvider
				config={deriveTemplateConfig(template, imageConfigs, [
					forwardStraightRuntimeManifest,
					secondary,
				])}
				template={template}
				navigation={navigation}
			>
				<GraphicMutationProbe />
			</TemplateStudioProvider>,
		)
		fireEvent.click(screen.getByRole('button', { name: 'update graphic' }))
		expect(screen.getByTestId('graphic-viewpoint')).toHaveTextContent('low-angle')
		fireEvent.click(screen.getByRole('button', { name: 'select secondary graphic' }))
		expect(screen.getByTestId('graphic-config')).toHaveTextContent('secondary')
		expect(screen.getByTestId('graphic-viewpoint')).toHaveTextContent('flat')
	})
})

function createImageConfig(
	id: number,
	promptAvailability?: 'enabled' | 'readonly' | 'disabled',
	promptDefault = '',
): ImageStudioConfig {
	const ratios = ['1:1', '4:3', '16:9'] as const
	return {
		studio: 'image',
		artifacts: ['raster'],
		id,
		version: 1,
		name: id === 11 ? '기본 프로파일' : `프로파일 ${id}`,
		output: { formats: ['png'], original: true },
		controller: {
			groups: [
				{
					id: 'image',
					title: 'Image',
					controls: [
						{
							id: 'prompt',
							kind: 'text',
							label: 'Prompt',
							defaultValue: promptDefault,
							...(promptAvailability ? { availability: promptAvailability } : {}),
							multiline: true,
							maxLength: 250,
							placeholder: '이미지를 설명하세요',
						},
					],
				},
				{
					id: 'profile-settings',
					title: 'Profile Settings',
					controls: [
						{
							id: 'lineColor',
							kind: 'color',
							label: 'Line Color',
							defaultValue: '#000000',
						},
						{
							id: 'backgroundColor',
							kind: 'color',
							label: 'Background Color',
							defaultValue: '#ffffff',
						},
					],
				},
				{
					id: 'generation-settings',
					title: 'Setting',
					controls: [
						{
							id: 'batch',
							kind: 'select',
							label: '장수',
							defaultValue: '1',
							options: [{ value: '1', label: '1' }],
						},
						{
							id: 'ratio',
							kind: 'select',
							label: '비율',
							defaultValue: '1:1',
							options: ratios.map((value) => ({ value, label: value })),
						},
						{
							id: 'resolution',
							kind: 'select',
							label: '해상도',
							defaultValue: '2K',
							options: [{ value: '2K', label: '2K' }],
						},
					],
				},
			],
		},
		image: {
			slug: `profile-${id}`,
			features: [
				{
					type: 'color-adjustment',
					controls: { line: 'lineColor', background: 'backgroundColor' },
				},
				{ type: 'camera-control' },
			],
		},
	}
}
