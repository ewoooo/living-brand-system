import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ImageStudioConfig } from '@/features/image-studio/image-studio-config'
import { ImageStudioProvider, useImageStudio } from './use-image-studio'

vi.mock('@/features/generate-image/hooks/use-image-generation', () => ({
	useImageGeneration: () => ({
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

function config(profileId: number, batchOptions: number[]): ImageStudioConfig {
	return {
		profileId,
		version: 1,
		name: `프로파일 ${profileId}`,
		slug: null,
		prompt: { maxLength: 500 },
		generateOptions: {
			batch: { options: batchOptions, defaultValue: batchOptions[0] },
			ratio: { options: ['2:3'], defaultValue: '2:3' },
			resolution: { options: ['1K'], defaultValue: '1K' },
		},
		supportsCameraControl: true,
	}
}

function Probe() {
	const { config: current, prompt, generation, results, profiles } = useImageStudio()
	return (
		<div>
			<output data-testid="state">
				{current.name} / {generation.batch} / {prompt.value} /{' '}
				{results.result ? '결과 있음' : '결과 없음'}
			</output>
			<button type="button" onClick={() => prompt.setValue('드론')}>
				프롬프트 입력
			</button>
			<button type="button" onClick={() => generation.setBatch(4)}>
				4장 선택
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

describe('ImageStudioProvider 프로파일 교체 정책', () => {
	afterEach(cleanup)

	it('어드민 정의 층만 갈아끼우고 프롬프트·결과는 남긴다', () => {
		renderStudio([config(5, [1, 2, 3, 4]), config(7, [1, 2, 3, 4])])

		fireEvent.click(screen.getByRole('button', { name: '프롬프트 입력' }))
		fireEvent.click(screen.getByRole('button', { name: '4장 선택' }))
		fireEvent.click(screen.getByRole('button', { name: '교체' }))

		// 새 프로파일도 4장을 지원하므로 선택이 유지된다.
		expect(screen.getByTestId('state')).toHaveTextContent('프로파일 7 / 4 / 드론 / 결과 있음')
	})

	it('새 프로파일이 지원하지 않는 선택만 시작값으로 되돌린다', () => {
		renderStudio([config(5, [1, 2, 3, 4]), config(7, [1, 2])])

		fireEvent.click(screen.getByRole('button', { name: '프롬프트 입력' }))
		fireEvent.click(screen.getByRole('button', { name: '4장 선택' }))
		fireEvent.click(screen.getByRole('button', { name: '교체' }))

		expect(screen.getByTestId('state')).toHaveTextContent('프로파일 7 / 1 / 드론 / 결과 있음')
	})
})
