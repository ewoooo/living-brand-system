import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deriveImageStudioConfig } from '@/features/image-studio/image-studio-config'
import { ImageGenerator } from './image-generator'

const mocks = vi.hoisted(() => ({ generate: vi.fn() }))

vi.mock('@/features/generate-image/hooks/use-image-generation', () => ({
	useImageGeneration: () => ({
		error: null,
		generate: mocks.generate,
		loading: false,
		requested: 0,
		result: null,
		selected: null,
		setSelected: vi.fn(),
	}),
}))
vi.mock('@/components/studio/generate/image-generation-results', () => ({
	ImageGenerationResults: () => null,
}))

function config(id: number, name: string) {
	return deriveImageStudioConfig({
		id,
		name,
		slug: null,
		imageModelPreset: 'openai-gpt-image-2',
		aspectRatio: '2:3',
		imageSize: '1K',
	})
}

describe('ImageGenerator', () => {
	beforeEach(() => vi.clearAllMocks())
	afterEach(cleanup)

	it('첫 계약의 프로파일로 생성하고 장수는 계약 시작값을 따른다', () => {
		render(
			createElement(ImageGenerator, {
				configs: [config(5, '에센허브 브랜드 제품컷')],
			}),
		)

		fireEvent.change(screen.getByRole('textbox', { name: '프롬프트' }), {
			target: { value: '파란 세럼병' },
		})
		fireEvent.click(screen.getByRole('button', { name: '이미지 생성' }))

		expect(mocks.generate).toHaveBeenCalledWith({
			count: 4,
			prompt: '파란 세럼병',
			profileId: 5,
		})
	})

	it('라우트가 지정한 프로파일을 처음 선택한다', () => {
		render(
			createElement(ImageGenerator, {
				configs: [config(5, '일러스트레이션'), config(7, '그라디언트')],
				initialProfileId: 7,
			}),
		)

		expect(screen.getByRole('combobox', { name: '프로파일' })).toHaveTextContent('그라디언트')
	})

	it('빈 캔버스의 예시를 프롬프트에 반영한다', () => {
		render(createElement(ImageGenerator, { configs: [config(5, '제품컷')] }))

		fireEvent.click(
			screen.getByRole('button', {
				name: '신제품을 위한 깨끗한 스튜디오 제품 이미지',
			}),
		)

		expect(screen.getByRole('textbox', { name: '프롬프트' })).toHaveValue(
			'신제품을 위한 깨끗한 스튜디오 제품 이미지',
		)
	})

	it('발행된 프로파일이 없으면 컨트롤러 없이 안내만 그린다', () => {
		render(createElement(ImageGenerator, { configs: [] }))

		expect(screen.getByText('발행된 이미지 프로파일이 없습니다')).toBeInTheDocument()
		expect(screen.queryByRole('textbox', { name: '프롬프트' })).not.toBeInTheDocument()
	})
})
