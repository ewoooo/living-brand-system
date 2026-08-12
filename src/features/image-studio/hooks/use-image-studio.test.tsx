import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/generate-image/image-size'
import {
	deriveImageStudioConfig,
	IMAGE_STUDIO_CONTROL_IDS,
	type ImageStudioConfig,
} from '@/features/image-studio/image-studio-config'
import type {
	ControllerAvailability,
	ControllerControlDefinition,
} from '@/features/studio-controller/controller-definition'
import { ImageStudioProvider, useImageStudio } from './use-image-studio'

vi.mock('@/features/generate-image/hooks/use-image-generation', () => ({
	useImageGeneration: () => ({
		adjustCamera: vi.fn(),
		error: null,
		generate: vi.fn(),
		loading: false,
		requested: 4,
		// 프로파일을 교체해도 남아야 하는 사용자 산출물.
		result: {
			aspectRatio: '2:3',
			generatedImages: [{ id: 8 }],
			images: ['blob:1'],
			imageSize: '1K',
			model: 'gpt-image-2',
			profileId: 5,
			prompt: '{}',
		},
		selected: 0,
		setSelected: vi.fn(),
	}),
}))

function config(
	profileId: number,
	options: {
		batch?: number[]
		ratio?: ImageAspectRatio[]
		resolution?: ImageOutputSize[]
		colorAdjustment?: { line: string; background?: string }
		maxPromptLength?: number
		promptAvailability?: ControllerAvailability
		promptDefault?: string
		ratioAvailability?: ControllerAvailability
	} = {},
): ImageStudioConfig {
	const base = deriveImageStudioConfig({
		id: profileId,
		name: `프로파일 ${profileId}`,
		slug: null,
		imageModelPreset: 'openai-gpt-image-2',
		aspectRatio: '2:3',
		imageSize: '1K',
		colorAdjustment: options.colorAdjustment,
	})
	const batch = (options.batch ?? [1, 2, 3, 4]).map(String)
	const ratio = options.ratio ?? ['2:3', '16:9']
	const resolution = options.resolution ?? ['1K', '2K']

	return {
		...base,
		controller: {
			groups: base.controller.groups.map((group) => ({
				...group,
				controls: group.controls.map((control) =>
					configureControl(control, {
						...options,
						batch,
						ratio,
						resolution,
					}),
				),
			})),
		},
	}
}

function configureControl(
	control: ControllerControlDefinition,
	options: {
		batch: string[]
		ratio: ImageAspectRatio[]
		resolution: ImageOutputSize[]
		maxPromptLength?: number
		promptAvailability?: ControllerAvailability
		promptDefault?: string
		ratioAvailability?: ControllerAvailability
	},
): ControllerControlDefinition {
	if (control.id === IMAGE_STUDIO_CONTROL_IDS.prompt && control.kind === 'text') {
		return {
			...control,
			defaultValue: options.promptDefault ?? control.defaultValue,
			maxLength: options.maxPromptLength ?? control.maxLength,
			availability: options.promptAvailability,
		}
	}
	if (control.kind !== 'select') return control
	const values =
		control.id === IMAGE_STUDIO_CONTROL_IDS.batch
			? options.batch
			: control.id === IMAGE_STUDIO_CONTROL_IDS.ratio
				? options.ratio
				: options.resolution
	return {
		...control,
		defaultValue: values[0] ?? null,
		options: values.map((value) => ({ label: value, value })),
		...(control.id === IMAGE_STUDIO_CONTROL_IDS.ratio
			? { availability: options.ratioAvailability }
			: {}),
	}
}

function Probe() {
	const {
		config: current,
		controls,
		prompt,
		generation,
		color,
		camera,
		results,
		profiles,
	} = useImageStudio()
	return (
		<div>
			<output data-testid="state">
				{current.name} / {generation.batch} / {generation.ratio} / {generation.resolution} /{' '}
				{prompt.value} / {results.result ? '결과 있음' : '결과 없음'}
			</output>
			<output data-testid="prompt-error">
				{controls.bindings.prompt?.error ?? '오류 없음'} /{' '}
				{generation.canRun ? '생성 가능' : '생성 불가'}
			</output>
			<output data-testid="color">
				{color.value
					? `${color.value.line}|${color.value.background ?? '없음'}`
					: '색 없음'}
			</output>
			<output data-testid="camera-seed">{camera.seedImage ?? '대상 없음'}</output>
			<button type="button" onClick={() => color.update({ line: '#ff0000' })}>
				라인 색 변경
			</button>
			<button type="button" onClick={() => prompt.setValue('드론')}>
				프롬프트 입력
			</button>
			<button type="button" onClick={() => generation.setBatch(4)}>
				4장 선택
			</button>
			<button type="button" onClick={() => generation.setRatio('16:9')}>
				16:9 선택
			</button>
			<button type="button" onClick={() => generation.setResolution('2K')}>
				2K 선택
			</button>
			<button type="button" onClick={() => profiles.select(7)}>
				교체
			</button>
		</div>
	)
}

function renderStudio(configs: ImageStudioConfig[]) {
	return render(
		<ImageStudioProvider configs={configs}>
			<Probe />
		</ImageStudioProvider>,
	)
}

function chooseAll() {
	fireEvent.click(screen.getByRole('button', { name: '프롬프트 입력' }))
	fireEvent.click(screen.getByRole('button', { name: '4장 선택' }))
	fireEvent.click(screen.getByRole('button', { name: '16:9 선택' }))
	fireEvent.click(screen.getByRole('button', { name: '2K 선택' }))
	fireEvent.click(screen.getByRole('button', { name: '교체' }))
}

describe('ImageStudioProvider 프로파일 교체 정책', () => {
	afterEach(cleanup)

	it('enabled 프롬프트·유효한 select와 생성 결과를 보존한다', () => {
		renderStudio([config(5), config(7)])

		chooseAll()

		expect(screen.getByTestId('state')).toHaveTextContent(
			'프로파일 7 / 4 / 16:9 / 2K / 드론 / 결과 있음',
		)
	})

	it('새 프로파일이 지원하지 않는 select만 시작값으로 되돌린다', () => {
		renderStudio([config(5), config(7, { batch: [1, 2], ratio: ['2:3'], resolution: ['1K'] })])

		chooseAll()

		expect(screen.getByTestId('state')).toHaveTextContent(
			'프로파일 7 / 1 / 2:3 / 1K / 드론 / 결과 있음',
		)
	})

	it('readonly select와 prompt는 새 계약 기본값으로 되돌린다', () => {
		renderStudio([
			config(5),
			config(7, {
				promptAvailability: 'readonly',
				promptDefault: '고정 프롬프트',
				ratioAvailability: 'readonly',
			}),
		])

		chooseAll()

		expect(screen.getByTestId('state')).toHaveTextContent(
			'프로파일 7 / 4 / 2:3 / 2K / 고정 프롬프트 / 결과 있음',
		)
	})

	it('색은 새 프로파일 기본값으로 되돌린다', () => {
		renderStudio([
			config(5, { colorAdjustment: { line: '#000dff', background: '#00ffd4' } }),
			config(7, { colorAdjustment: { line: '#112233' } }),
		])

		fireEvent.click(screen.getByRole('button', { name: '라인 색 변경' }))
		expect(screen.getByTestId('color')).toHaveTextContent('#ff0000|#00ffd4')
		fireEvent.click(screen.getByRole('button', { name: '교체' }))

		expect(screen.getByTestId('color')).toHaveTextContent('#112233|없음')
	})

	it('color control이 있어도 feature가 없으면 색 조정을 적용하지 않는다', () => {
		const withColorControls = config(5, {
			colorAdjustment: { line: '#000dff', background: '#00ffd4' },
		})
		renderStudio([
			{
				...withColorControls,
				image: { ...withColorControls.image, features: [] },
			},
		])

		expect(screen.getByTestId('color')).toHaveTextContent('색 없음')
		fireEvent.click(screen.getByRole('button', { name: '라인 색 변경' }))
		expect(screen.getByTestId('color')).toHaveTextContent('색 없음')
	})

	it('프로파일 교체 후 이전 결과는 보존하되 camera seed로 열지 않는다', () => {
		renderStudio([config(5), config(7)])
		expect(screen.getByTestId('camera-seed')).toHaveTextContent('blob:1')

		fireEvent.click(screen.getByRole('button', { name: '교체' }))

		expect(screen.getByTestId('state')).toHaveTextContent('결과 있음')
		expect(screen.getByTestId('camera-seed')).toHaveTextContent('대상 없음')
	})

	it('새 maxLength를 넘는 enabled 프롬프트는 자르지 않고 오류로 생성만 막는다', () => {
		renderStudio([config(5), config(7, { maxPromptLength: 1 })])

		fireEvent.click(screen.getByRole('button', { name: '프롬프트 입력' }))
		fireEvent.click(screen.getByRole('button', { name: '교체' }))

		expect(screen.getByTestId('state')).toHaveTextContent('/ 드론 / 결과 있음')
		expect(screen.getByTestId('prompt-error')).toHaveTextContent(
			'프롬프트가 최대 1자를 초과했습니다. / 생성 불가',
		)
	})
})
