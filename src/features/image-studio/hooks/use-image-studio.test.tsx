import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ImageAspectRatio, ImageOutputSize } from '@/features/generate-image/image-size'
import type { ImageStudioConfig } from '@/features/image-studio/image-studio-config'
import { ImageStudioProvider, useImageStudio } from './use-image-studio'

vi.mock('@/features/generate-image/hooks/use-image-generation', () => ({
	useImageGeneration: () => ({
		adjustCamera: vi.fn(),
		error: null,
		generate: vi.fn(),
		loading: false,
		requested: 4,
		// 프로파일을 교체해도 남아야 하는 사용자 산출물.
		result: { images: ['blob:1'], model: 'gpt-image-2', prompt: '{}' },
		selected: null,
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
	} = {},
): ImageStudioConfig {
	const batch = options.batch ?? [1, 2, 3, 4]
	const ratio = options.ratio ?? ['2:3', '16:9']
	const resolution = options.resolution ?? ['1K', '2K']
	return {
		profileId,
		version: 1,
		name: `프로파일 ${profileId}`,
		slug: null,
		prompt: { maxLength: 500 },
		generateOptions: {
			batch: { options: batch, defaultValue: batch[0] },
			ratio: { options: ratio, defaultValue: ratio[0] },
			resolution: { options: resolution, defaultValue: resolution[0] },
		},
		supportsCameraControl: true,
		...(options.colorAdjustment ? { colorAdjustment: options.colorAdjustment } : {}),
	}
}

function Probe() {
	const { config: current, prompt, generation, color, results, profiles } = useImageStudio()
	return (
		<div>
			<output data-testid="state">
				{current.name} / {generation.batch} / {generation.ratio} / {generation.resolution} /{' '}
				{prompt.value} / {results.result ? '결과 있음' : '결과 없음'}
			</output>
			<output data-testid="color">
				{color.value
					? `${color.value.line}|${color.value.background ?? '없음'}`
					: '색 없음'}
			</output>
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

	it('어드민 정의 층만 갈아끼우고 프롬프트·결과는 남긴다', () => {
		renderStudio([config(5), config(7)])

		chooseAll()

		// 새 프로파일도 같은 선택지를 지원하므로 세 선택 모두 유지된다.
		expect(screen.getByTestId('state')).toHaveTextContent(
			'프로파일 7 / 4 / 16:9 / 2K / 드론 / 결과 있음',
		)
	})

	it('새 프로파일이 지원하지 않는 선택만 시작값으로 되돌린다', () => {
		renderStudio([config(5), config(7, { batch: [1, 2], ratio: ['2:3'], resolution: ['1K'] })])

		chooseAll()

		expect(screen.getByTestId('state')).toHaveTextContent(
			'프로파일 7 / 1 / 2:3 / 1K / 드론 / 결과 있음',
		)
	})

	it('색 세션 값은 계약의 기본값에서 시작한다', () => {
		renderStudio([config(5, { colorAdjustment: { line: '#000dff', background: '#00ffd4' } })])

		expect(screen.getByTestId('color')).toHaveTextContent('#000dff|#00ffd4')
	})

	it('계약이 색을 열지 않으면 색 값이 없다', () => {
		renderStudio([config(5)])

		expect(screen.getByTestId('color')).toHaveTextContent('색 없음')
	})

	it('프로파일을 교체하면 고른 색은 새 계약 기본값으로 되돌리고 프롬프트·결과는 남긴다', () => {
		renderStudio([
			config(5, { colorAdjustment: { line: '#000dff', background: '#00ffd4' } }),
			config(7, { colorAdjustment: { line: '#112233' } }),
		])

		fireEvent.click(screen.getByRole('button', { name: '라인 색 변경' }))
		expect(screen.getByTestId('color')).toHaveTextContent('#ff0000|#00ffd4')

		chooseAll()

		expect(screen.getByTestId('color')).toHaveTextContent('#112233|없음')
		expect(screen.getByTestId('state')).toHaveTextContent(
			'프로파일 7 / 4 / 16:9 / 2K / 드론 / 결과 있음',
		)
	})
})
